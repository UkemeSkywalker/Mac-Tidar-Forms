import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ConditionalCheckFailedException, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Form, FormResponse, User } from "./types";

export interface Store {
  getUserByEmail(email: string): Promise<User | null>;
  /** Returns false when the email is already registered. */
  createUser(user: User): Promise<boolean>;
  getForm(id: string): Promise<Form | null>;
  listForms(ownerId: string): Promise<Form[]>;
  saveForm(form: Form): Promise<void>;
  deleteForm(id: string): Promise<void>;
  addResponse(response: FormResponse): Promise<void>;
  listResponses(formId: string): Promise<FormResponse[]>;
  deleteResponse(formId: string, responseId: string): Promise<void>;
}

const bySubmittedAt = (a: FormResponse, b: FormResponse) => a.submittedAt.localeCompare(b.submittedAt);

/* Single-table layout:
   USER#<email> / PROFILE
   FORM#<id>    / META       (GSI1: OWNER#<ownerId> / <updatedAt>)
   FORM#<id>    / RESP#<id>  (response ids sort by time) */
class DynamoStore implements Store {
  private db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.DATA_REGION }), {
    marshallOptions: { removeUndefinedValues: true },
  });

  constructor(private table: string) {}

  async getUserByEmail(email: string) {
    const { Item } = await this.db.send(
      new GetCommand({ TableName: this.table, Key: { PK: `USER#${email}`, SK: "PROFILE" } }),
    );
    return (Item as User | undefined) ?? null;
  }

  async createUser(user: User) {
    try {
      await this.db.send(
        new PutCommand({
          TableName: this.table,
          Item: { PK: `USER#${user.email}`, SK: "PROFILE", ...user },
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
      return true;
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) return false;
      throw err;
    }
  }

  async getForm(id: string) {
    const { Item } = await this.db.send(
      new GetCommand({ TableName: this.table, Key: { PK: `FORM#${id}`, SK: "META" }, ConsistentRead: true }),
    );
    return (Item as Form | undefined) ?? null;
  }

  async listForms(ownerId: string) {
    const items = await this.queryAll({
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": `OWNER#${ownerId}` },
      ScanIndexForward: false,
    });
    return items as Form[];
  }

  /* responseCount is owned by addResponse/deleteResponse, so a builder save
     must not overwrite it with a stale value. */
  async saveForm(form: Form) {
    const { responseCount, ...rest } = form;
    const item = {
      ...rest,
      PK: `FORM#${form.id}`,
      SK: "META",
      GSI1PK: `OWNER#${form.ownerId}`,
      GSI1SK: form.updatedAt,
    };
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = { ":zero": responseCount ?? 0 };
    const sets = ["#responseCount = if_not_exists(#responseCount, :zero)"];
    names["#responseCount"] = "responseCount";
    for (const [key, value] of Object.entries(item)) {
      if (key === "PK" || key === "SK" || value === undefined) continue;
      names[`#${key}`] = key;
      values[`:${key}`] = value;
      sets.push(`#${key} = :${key}`);
    }
    await this.db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: this.table,
              Key: { PK: item.PK, SK: item.SK },
              UpdateExpression: `SET ${sets.join(", ")}`,
              ExpressionAttributeNames: names,
              ExpressionAttributeValues: values,
            },
          },
        ],
      }),
    );
  }

  async deleteForm(id: string) {
    const items = await this.queryAll({
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `FORM#${id}` },
      ProjectionExpression: "PK, SK",
    });
    for (let i = 0; i < items.length; i += 25) {
      let pending: Record<string, { DeleteRequest: { Key: Record<string, unknown> } }[]> | undefined = {
        [this.table]: items.slice(i, i + 25).map((it) => ({ DeleteRequest: { Key: { PK: it.PK, SK: it.SK } } })),
      };
      while (pending && Object.keys(pending).length) {
        const out = await this.db.send(new BatchWriteCommand({ RequestItems: pending }));
        pending = out.UnprocessedItems as typeof pending;
      }
    }
  }

  async addResponse(response: FormResponse) {
    await this.db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.table,
              Item: { PK: `FORM#${response.formId}`, SK: `RESP#${response.id}`, ...response },
            },
          },
          {
            Update: {
              TableName: this.table,
              Key: { PK: `FORM#${response.formId}`, SK: "META" },
              UpdateExpression: "ADD responseCount :one",
              ConditionExpression: "attribute_exists(PK)",
              ExpressionAttributeValues: { ":one": 1 },
            },
          },
        ],
      }),
    );
  }

  async listResponses(formId: string) {
    const items = await this.queryAll({
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `FORM#${formId}`, ":sk": "RESP#" },
    });
    return (items as FormResponse[]).sort(bySubmittedAt);
  }

  async deleteResponse(formId: string, responseId: string) {
    await this.db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: this.table,
              Key: { PK: `FORM#${formId}`, SK: `RESP#${responseId}` },
              ConditionExpression: "attribute_exists(PK)",
            },
          },
          {
            Update: {
              TableName: this.table,
              Key: { PK: `FORM#${formId}`, SK: "META" },
              UpdateExpression: "ADD responseCount :minus",
              ExpressionAttributeValues: { ":minus": -1 },
            },
          },
        ],
      }),
    );
  }

  private async queryAll(input: Omit<ConstructorParameters<typeof QueryCommand>[0], "TableName">) {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const out = await this.db.send(new QueryCommand({ ...input, TableName: this.table, ExclusiveStartKey }));
      items.push(...((out.Items ?? []) as Record<string, unknown>[]));
      ExclusiveStartKey = out.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }
}

type FileData = { users: Record<string, User>; forms: Record<string, Form>; responses: FormResponse[] };

/* Local development only: a JSON file, so the app runs without AWS. */
class FileStore implements Store {
  private path = join(process.cwd(), ".data", "store.json");

  private read(): FileData {
    try {
      return JSON.parse(readFileSync(this.path, "utf8"));
    } catch {
      return { users: {}, forms: {}, responses: [] };
    }
  }

  private write(data: FileData) {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    writeFileSync(this.path, JSON.stringify(data, null, 2));
  }

  async getUserByEmail(email: string) {
    return this.read().users[email] ?? null;
  }

  async createUser(user: User) {
    const data = this.read();
    if (data.users[user.email]) return false;
    data.users[user.email] = user;
    this.write(data);
    return true;
  }

  async getForm(id: string) {
    return this.read().forms[id] ?? null;
  }

  async listForms(ownerId: string) {
    return Object.values(this.read().forms)
      .filter((f) => f.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async saveForm(form: Form) {
    const data = this.read();
    data.forms[form.id] = { ...form, responseCount: data.forms[form.id]?.responseCount ?? form.responseCount };
    this.write(data);
  }

  async deleteForm(id: string) {
    const data = this.read();
    delete data.forms[id];
    data.responses = data.responses.filter((r) => r.formId !== id);
    this.write(data);
  }

  async addResponse(response: FormResponse) {
    const data = this.read();
    data.responses.push(response);
    data.forms[response.formId].responseCount += 1;
    this.write(data);
  }

  async listResponses(formId: string) {
    return this.read().responses.filter((r) => r.formId === formId).sort(bySubmittedAt);
  }

  async deleteResponse(formId: string, responseId: string) {
    const data = this.read();
    const before = data.responses.length;
    data.responses = data.responses.filter((r) => !(r.formId === formId && r.id === responseId));
    if (data.responses.length !== before) data.forms[formId].responseCount -= 1;
    this.write(data);
  }
}

let instance: Store | undefined;

export function store(): Store {
  if (instance) return instance;
  const table = process.env.TABLE_NAME;
  // next build also runs with NODE_ENV=production, but never calls the store.
  if (!table && process.env.NODE_ENV === "production" && !process.env.ALLOW_FILE_STORE) {
    throw new Error("TABLE_NAME is required in production");
  }
  instance = table ? new DynamoStore(table) : new FileStore();
  return instance;
}
