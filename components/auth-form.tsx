"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Brand } from "./brand";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    if (res.ok) {
      router.push("/forms");
      router.refresh();
      return;
    }
    setError((await res.json()).error ?? "Something went wrong.");
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Brand />
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="text-xl font-semibold">{signup ? "Create your account" : "Sign in"}</h1>
        {signup && (
          <label className="block space-y-1 text-sm font-medium">
            Name
            <input name="name" required autoComplete="name" className="input font-normal" />
          </label>
        )}
        <label className="block space-y-1 text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" className="input font-normal" />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={signup ? 8 : undefined}
            autoComplete={signup ? "new-password" : "current-password"}
            className="input font-normal"
          />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted">
          {signup ? "Already have an account? " : "New here? "}
          <Link className="font-medium text-forest underline" href={signup ? "/login" : "/signup"}>
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </form>
    </main>
  );
}
