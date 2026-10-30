"use client";

import { type FormEvent, useState } from "react";
import type { Answer, Field } from "@/lib/types";

type Props = { formId: string; title: string; description: string; fields: Field[]; preview?: boolean };

export function FormRenderer({ formId, title, description, fields, preview }: Props) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (id: string, value: Answer) => setAnswers((prev) => ({ ...prev, [id]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;
    setBusy(true);
    setFormError("");
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    try {
      const res = await fetch(`/api/public/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, website }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else if (data.errors) setErrors(data.errors);
      else setFormError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-semibold text-forest">Thank you</h1>
        <p className="mt-2 text-muted">Your response has been recorded.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="card border-t-4 border-t-forest p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-2 whitespace-pre-wrap text-muted">{description}</p>}
      </div>
      {fields.map((field) => (
        <fieldset key={field.id} className="card p-6">
          <legend className="float-left mb-3 w-full font-medium">
            {field.label}
            {field.required && <span className="text-danger"> *</span>}
          </legend>
          {field.help && <p className="clear-both mb-3 text-sm text-muted">{field.help}</p>}
          <div className="clear-both">
            <Control field={field} value={answers[field.id]} onChange={(value) => set(field.id, value)} />
          </div>
          {errors[field.id] && <p role="alert" className="mt-2 text-sm text-danger">{errors[field.id]}</p>}
        </fieldset>
      ))}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0" />
      {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
      {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-danger">Please fix the highlighted questions.</p>}
      {!preview && (
        <button disabled={busy} className="btn btn-primary">{busy ? "Sending…" : "Submit"}</button>
      )}
    </form>
  );
}

function Control({ field, value, onChange }: { field: Field; value?: Answer; onChange: (value: Answer) => void }) {
  const str = typeof value === "string" ? value : "";
  const label = field.label;
  switch (field.type) {
    case "long_text":
      return <textarea aria-label={label} rows={4} className="input" value={str} onChange={(e) => onChange(e.target.value)} />;
    case "single_choice":
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input type="radio" name={field.id} checked={str === option} onChange={() => onChange(option)} />
              {option}
            </label>
          ))}
        </div>
      );
    case "multi_choice": {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={picked.includes(option)}
                onChange={(e) => onChange(e.target.checked ? [...picked, option] : picked.filter((p) => p !== option))}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }
    case "dropdown":
      return (
        <select aria-label={label} className="input" value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {field.options?.map((option) => <option key={option}>{option}</option>)}
        </select>
      );
    case "rating":
      return (
        <div className="flex gap-2">
          {["1", "2", "3", "4", "5"].map((n) => (
            <label key={n} className={`btn ${str === n ? "btn-primary" : "btn-ghost"} w-11`}>
              <input type="radio" className="sr-only" name={field.id} checked={str === n} onChange={() => onChange(n)} />
              {n}
            </label>
          ))}
        </div>
      );
    default: {
      const type = field.type === "short_text" ? "text" : field.type;
      return <input aria-label={label} type={type} className="input" value={str} onChange={(e) => onChange(e.target.value)} />;
    }
  }
}
