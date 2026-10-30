import { NextResponse } from "next/server";
import { newId } from "@/lib/auth";
import { validateAnswers } from "@/lib/forms";
import { fail, jsonBody } from "@/lib/http";
import { store } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await store().getForm(id);
  if (!form || !form.published) return fail(404, "This form is not accepting responses.");

  const body = await jsonBody(req);
  if (!body) return fail(400, "Invalid request.");
  // Honeypot: bots fill the hidden field. Pretend it worked and store nothing.
  if (body.website) return NextResponse.json({ ok: true });

  const answers = typeof body.answers === "object" && body.answers ? (body.answers as Record<string, unknown>) : {};
  const result = validateAnswers(form.fields, answers);
  if ("errors" in result) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const submittedAt = new Date().toISOString();
  await store().addResponse({
    id: `${submittedAt}_${newId().slice(0, 8)}`,
    formId: form.id,
    answers: result.answers,
    submittedAt,
  });
  return NextResponse.json({ ok: true });
}
