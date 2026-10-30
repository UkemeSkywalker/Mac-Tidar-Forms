import type { Answer, Form, FormResponse } from "./types";

export const cell = (answer?: Answer) => (Array.isArray(answer) ? answer.join(", ") : (answer ?? ""));

/** Header row plus one row per response, oldest first. */
export function toSheet(form: Form, responses: FormResponse[]) {
  const header = ["Submitted at", ...form.fields.map((f) => f.label)];
  const rows = responses.map((r) => [r.submittedAt, ...form.fields.map((f) => cell(r.answers[f.id]))]);
  return { header, rows };
}

/* Respondents control these values, so neutralise anything a spreadsheet
   app would run as a formula when the owner opens the file. */
const safe = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);

export function toCsv(header: string[], rows: string[][]) {
  return [header, ...rows]
    .map((row) => row.map((v) => `"${safe(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

export const fileName = (title: string, ext: string) =>
  `${title.replace(/[^\w -]+/g, "").trim().replace(/\s+/g, "-") || "form"}-responses.${ext}`;
