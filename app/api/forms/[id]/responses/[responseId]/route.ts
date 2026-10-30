import { NextResponse } from "next/server";
import { currentUser, ownedForm } from "@/lib/auth";
import { fail } from "@/lib/http";
import { store } from "@/lib/store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; responseId: string }> }) {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const { id, responseId } = await params;
  const form = await ownedForm(id, user);
  if (!form) return fail(404, "Form not found.");
  await store().deleteResponse(form.id, responseId);
  return NextResponse.json({ ok: true });
}
