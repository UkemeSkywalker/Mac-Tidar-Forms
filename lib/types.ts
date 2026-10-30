export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "number",
  "date",
  "single_choice",
  "multi_choice",
  "dropdown",
  "rating",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_LABELS: Record<FieldType, string> = {
  short_text: "Short answer",
  long_text: "Paragraph",
  email: "Email",
  number: "Number",
  date: "Date",
  single_choice: "Multiple choice",
  multi_choice: "Checkboxes",
  dropdown: "Dropdown",
  rating: "Rating (1–5)",
};

export const hasOptions = (type: FieldType) =>
  type === "single_choice" || type === "multi_choice" || type === "dropdown";

export type Field = {
  id: string;
  type: FieldType;
  label: string;
  help?: string;
  required: boolean;
  options?: string[];
};

export type Form = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  fields: Field[];
  published: boolean;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Answer = string | string[];

export type FormResponse = {
  id: string;
  formId: string;
  answers: Record<string, Answer>;
  submittedAt: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};
