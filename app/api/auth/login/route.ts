import { NextResponse } from "next/server";
import { startSession, verifyPassword } from "@/lib/auth";
import { fail, jsonBody } from "@/lib/http";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  const body = await jsonBody(req);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const user = email ? await store().getUserByEmail(email) : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail(401, "Incorrect email or password.");
  }
  await startSession(email);
  return NextResponse.json({ ok: true });
}
