import { NextResponse } from "next/server";
import { currentUser, newId } from "@/lib/auth";
import { fail } from "@/lib/http";
import { store } from "@/lib/store";

export async function POST() {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const now = new Date().toISOString();
  const id = newId();
  await store().saveForm({
    id,
    ownerId: user.id,
    title: "Untitled form",
    description: "",
    fields: [{ id: newId(), type: "short_text", label: "Your first question", required: false }],
    published: false,
    responseCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ id });
}
