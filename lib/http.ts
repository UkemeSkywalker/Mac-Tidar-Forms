import { NextResponse } from "next/server";

export const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

/** Parses a JSON body; null when it is malformed or not an object. */
export async function jsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
