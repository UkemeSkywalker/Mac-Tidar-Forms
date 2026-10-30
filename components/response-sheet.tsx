"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Row = { id: string; cells: string[] };

export function ResponseSheet({ formId, header, rows }: { formId: string; header: string[]; rows: Row[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const newestFirst = [...rows].reverse();
    return q ? newestFirst.filter((r) => r.cells.some((c) => c.toLowerCase().includes(q))) : newestFirst;
  }, [rows, query]);

  async function remove(id: string) {
    if (!confirm("Delete this response? This can't be undone.")) return;
    await fetch(`/api/forms/${formId}/responses/${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label="Search responses"
          placeholder="Search responses"
          className="input max-w-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="text-sm text-muted">{visible.length} of {rows.length}</span>
        <a href={`/api/forms/${formId}/export?format=xlsx`} className="btn btn-primary ml-auto">Download Excel</a>
        <a href={`/api/forms/${formId}/export?format=csv`} className="btn btn-ghost">Download CSV</a>
      </div>
      {rows.length === 0 ? (
        <div className="card p-10 text-center text-muted">No responses yet. Publish the form and share its link.</div>
      ) : (
        <div className="card overflow-auto" style={{ maxHeight: "70vh" }}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-mint-soft">
              <tr>
                <th scope="col" className="border-b border-r border-line px-2 py-2 text-right font-medium text-muted">#</th>
                {header.map((h, i) => (
                  <th key={i} scope="col" className="min-w-40 border-b border-r border-line px-3 py-2 text-left font-semibold">{h}</th>
                ))}
                <th scope="col" className="border-b border-line px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="hover:bg-linen">
                  <td className="border-b border-r border-line px-2 py-2 text-right text-muted">{rows.indexOf(row) + 1}</td>
                  {row.cells.map((c, i) => (
                    <td key={i} className="max-w-80 truncate border-b border-r border-line px-3 py-2" title={c}>
                      {i === 0 ? new Date(c).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : c}
                    </td>
                  ))}
                  <td className="border-b border-line px-3 py-2">
                    <button onClick={() => remove(row.id)} className="text-xs font-medium text-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
