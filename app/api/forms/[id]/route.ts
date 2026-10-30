import { NextResponse } from "next/server";
import { currentUser, ownedForm } from "@/lib/auth";
import { sanitizeFields } from "@/lib/forms";
import { fail, jsonBody } from "@/lib/http";
import { store } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const form = await ownedForm((await params).id, user);
  if (!form) return fail(404, "Form not found.");

  const body = await jsonBody(req);
  if (!body) return fail(400, "Invalid request.");
  const fields = sanitizeFields(body.fields);
  if (typeof fields === "string") return fail(400, fields);
  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) return fail(400, "Give the form a title.");

  const updated = {
    ...form,
    title,
    description: String(body.description ?? "").trim().slice(0, 2000),
    fields,
    published: Boolean(body.published),
    updatedAt: new Date().toISOString(),
  };
  await store().saveForm(updated);
  return NextResponse.json({ updatedAt: updated.updatedAt });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const form = await ownedForm((await params).id, user);
  if (!form) return fail(404, "Form not found.");
  await store().deleteForm(form.id);
  return NextResponse.json({ ok: true });
}
