"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FIELD_LABELS, FIELD_TYPES, type Field, type FieldType, type Form, hasOptions } from "@/lib/types";

export function FormBuilder({ form }: { form: Form }) {
  const router = useRouter();
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description);
  const [fields, setFields] = useState(form.fields);
  const [published, setPublished] = useState(form.published);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const patch = (id: string, change: Partial<Field>) =>
    setFields((all) => all.map((f) => (f.id === id ? { ...f, ...change } : f)));

  function changeType(field: Field, type: FieldType) {
    patch(field.id, { type, options: hasOptions(type) ? (field.options?.length ? field.options : ["Option 1"]) : undefined });
  }

  function move(index: number, by: number) {
    setFields((all) => {
      const next = [...all];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  }

  async function save(nextPublished = published) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/forms/${form.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, fields, published: nextPublished }),
    });
    if (res.ok) {
      setPublished(nextPublished);
      setStatus(nextPublished !== published ? (nextPublished ? "Published" : "Unpublished") : "Saved");
      router.refresh();
    } else {
      setError((await res.json()).error ?? "Couldn't save.");
    }
    setBusy(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/f/${form.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove() {
    if (!confirm(`Delete "${form.title}" and all its responses? This can't be undone.`)) return;
    await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
    router.push("/forms");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={busy} onClick={() => save()} className="btn btn-primary">Save</button>
        <button disabled={busy} onClick={() => save(!published)} className="btn btn-ghost">
          {published ? "Unpublish" : "Save & publish"}
        </button>
        {published && <button onClick={copyLink} className="btn btn-ghost">{copied ? "Copied" : "Copy link"}</button>}
        <Link href={`/f/${form.id}?preview=1`} target="_blank" className="btn btn-ghost">Preview</Link>
        <span aria-live="polite" className="text-sm text-muted">{status}</span>
        <button onClick={remove} className="btn ml-auto text-danger">Delete form</button>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <div className="card space-y-3 border-t-4 border-t-forest p-6">
        <input aria-label="Form title" className="input text-xl font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          aria-label="Form description"
          placeholder="Description (optional)"
          rows={2}
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="card space-y-3 p-5">
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Question"
              placeholder="Question"
              className="input min-w-52 flex-1"
              value={field.label}
              onChange={(e) => patch(field.id, { label: e.target.value })}
            />
            <select
              aria-label="Question type"
              className="input w-auto"
              value={field.type}
              onChange={(e) => changeType(field, e.target.value as FieldType)}
            >
              {FIELD_TYPES.map((type) => <option key={type} value={type}>{FIELD_LABELS[type]}</option>)}
            </select>
          </div>
          <input
            aria-label="Help text"
            placeholder="Help text (optional)"
            className="input"
            value={field.help ?? ""}
            onChange={(e) => patch(field.id, { help: e.target.value })}
          />
          {hasOptions(field.type) && (
            <div className="space-y-2">
              {field.options?.map((option, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    aria-label={`Option ${i + 1}`}
                    className="input"
                    value={option}
                    onChange={(e) => patch(field.id, { options: field.options?.map((o, j) => (j === i ? e.target.value : o)) })}
                  />
                  <button
                    aria-label={`Remove option ${i + 1}`}
                    className="btn btn-ghost"
                    onClick={() => patch(field.id, { options: field.options?.filter((_, j) => j !== i) })}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="btn btn-ghost"
                onClick={() => patch(field.id, { options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] })}
              >
                Add option
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-line pt-3 text-sm">
            <label className="mr-auto flex items-center gap-2">
              <input type="checkbox" checked={field.required} onChange={(e) => patch(field.id, { required: e.target.checked })} />
              Required
            </label>
            <button aria-label="Move up" disabled={index === 0} className="btn btn-ghost" onClick={() => move(index, -1)}>↑</button>
            <button aria-label="Move down" disabled={index === fields.length - 1} className="btn btn-ghost" onClick={() => move(index, 1)}>↓</button>
            <button className="btn text-danger" onClick={() => setFields((all) => all.filter((f) => f.id !== field.id))}>Remove</button>
          </div>
        </div>
      ))}

      <button
        className="btn btn-ghost w-full"
        onClick={() => setFields((all) => [...all, { id: crypto.randomUUID(), type: "short_text", label: "", required: false }])}
      >
        Add question
      </button>
    </div>
  );
}
