"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewFormButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/forms", { method: "POST" });
    if (!res.ok) return setBusy(false);
    router.push(`/forms/${(await res.json()).id}/edit`);
  }

  return <button disabled={busy} onClick={create} className="btn btn-primary">{busy ? "Creating…" : "New form"}</button>;
}
