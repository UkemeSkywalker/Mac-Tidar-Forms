import { NextResponse } from "next/server";
import { hashPassword, newId, startSession } from "@/lib/auth";
import { fail, jsonBody } from "@/lib/http";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  const body = await jsonBody(req);
  const name = String(body?.name ?? "").trim().slice(0, 100);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!name) return fail(400, "Enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Enter a valid email address.");
  if (password.length < 8 || password.length > 200) return fail(400, "Password must be at least 8 characters.");

  const created = await store().createUser({
    id: newId(),
    email,
    name,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  if (!created) return fail(409, "An account with this email already exists.");
  await startSession(email);
  return NextResponse.json({ ok: true });
}
