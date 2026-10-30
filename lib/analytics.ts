import type { Field, FormResponse } from "./types";

export type Bar = { label: string; count: number; percent: number };

export type Summary =
  | { kind: "bars"; field: Field; answered: number; bars: Bar[]; average?: number }
  | { kind: "number"; field: Field; answered: number; average: number; min: number; max: number }
  | { kind: "list"; field: Field; answered: number; latest: string[] };

const DAY = 86_400_000;

/** Responses per UTC day for the last `days` days, oldest first. */
export function dailyCounts(responses: FormResponse[], days = 30, now = Date.now()) {
  const today = Math.floor(now / DAY);
  const counts = new Map<number, number>();
  for (const r of responses) {
    const day = Math.floor(Date.parse(r.submittedAt) / DAY);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const day = today - days + 1 + i;
    return { date: new Date(day * DAY).toISOString().slice(0, 10), count: counts.get(day) ?? 0 };
  });
}

export function summarize(field: Field, responses: FormResponse[]): Summary {
  const values = responses.map((r) => r.answers[field.id]).filter((v) => v !== undefined);
  const answered = values.length;

  // Percentages are of people who answered, so checkbox bars can total over 100%.
  const bars = (labels: string[]): Bar[] =>
    labels.map((label) => {
      const count = values.filter((v) => (Array.isArray(v) ? v.includes(label) : v === label)).length;
      return { label, count, percent: answered ? Math.round((count / answered) * 100) : 0 };
    });

  switch (field.type) {
    case "single_choice":
    case "multi_choice":
    case "dropdown":
      return { kind: "bars", field, answered, bars: bars(field.options ?? []) };
    case "rating": {
      const average = answered ? values.reduce((sum, v) => sum + Number(v), 0) / answered : undefined;
      return { kind: "bars", field, answered, bars: bars(["1", "2", "3", "4", "5"]), average };
    }
    case "number": {
      const nums = values.map(Number);
      return {
        kind: "number",
        field,
        answered,
        average: answered ? nums.reduce((a, b) => a + b, 0) / answered : 0,
        min: answered ? Math.min(...nums) : 0,
        max: answered ? Math.max(...nums) : 0,
      };
    }
    default:
      return { kind: "list", field, answered, latest: values.slice(-5).reverse().map(String) };
  }
}
