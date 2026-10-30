import { FIELD_TYPES, type Answer, type Field, type FieldType, hasOptions } from "./types";

const MAX_FIELDS = 100;
const MAX_OPTIONS = 50;
const MAX_ANSWER = 5000;

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

/** Cleans untrusted builder input. Returns a field list, or an error message. */
export function sanitizeFields(input: unknown): Field[] | string {
  if (!Array.isArray(input)) return "Fields are missing.";
  if (input.length > MAX_FIELDS) return `A form can have at most ${MAX_FIELDS} questions.`;
  const seen = new Set<string>();
  const fields: Field[] = [];
  for (const raw of input) {
    const type = raw?.type as FieldType;
    const id = text(raw?.id, 64);
    if (!FIELD_TYPES.includes(type) || !id || seen.has(id)) return "A question is invalid.";
    seen.add(id);
    const label = text(raw?.label, 300);
    if (!label) return "Every question needs a title.";
    const field: Field = { id, type, label, required: Boolean(raw?.required) };
    const help = text(raw?.help, 500);
    if (help) field.help = help;
    if (hasOptions(type)) {
      const options = Array.isArray(raw?.options) ? raw.options.map((o: unknown) => text(o, 200)).filter(Boolean) : [];
      const unique = [...new Set<string>(options)].slice(0, MAX_OPTIONS);
      if (unique.length === 0) return `"${label}" needs at least one option.`;
      field.options = unique;
    }
    fields.push(field);
  }
  return fields;
}

/** Validates a submission against the form. Returns clean answers, or per-field errors. */
export function validateAnswers(
  fields: Field[],
  input: Record<string, unknown>,
): { answers: Record<string, Answer> } | { errors: Record<string, string> } {
  const answers: Record<string, Answer> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const raw = input[field.id];
    if (field.type === "multi_choice") {
      const picked = Array.isArray(raw) ? raw.map(String) : [];
      if (picked.some((p) => !field.options?.includes(p))) errors[field.id] = "Choose from the listed options.";
      else if (picked.length) answers[field.id] = [...new Set(picked)];
      else if (field.required) errors[field.id] = "This question is required.";
      continue;
    }

    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (field.required) errors[field.id] = "This question is required.";
      continue;
    }
    const problem = checkValue(field, value);
    if (problem) errors[field.id] = problem;
    else answers[field.id] = value;
  }

  return Object.keys(errors).length ? { errors } : { answers };
}

function checkValue(field: Field, value: string): string | null {
  if (value.length > MAX_ANSWER) return "This answer is too long.";
  switch (field.type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Enter a valid email address.";
    case "number":
      return Number.isFinite(Number(value)) ? null : "Enter a number.";
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? null : "Enter a valid date.";
    case "rating":
      return ["1", "2", "3", "4", "5"].includes(value) ? null : "Choose a rating from 1 to 5.";
    case "single_choice":
    case "dropdown":
      return field.options?.includes(value) ? null : "Choose from the listed options.";
    default:
      return null;
  }
}
