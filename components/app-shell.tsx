"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "./brand";

export function AppShell({ name, children }: { name: string; children: ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Brand href="/forms" />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{name}</span>
            <button onClick={logout} className="btn btn-ghost">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
