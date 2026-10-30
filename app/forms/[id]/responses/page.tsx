import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FormTabs } from "@/components/form-tabs";
import { ResponseSheet } from "@/components/response-sheet";
import { ownedForm, requireUser } from "@/lib/auth";
import { toSheet } from "@/lib/sheet";
import { store } from "@/lib/store";

export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const form = await ownedForm((await params).id, user);
  if (!form) notFound();
  const responses = await store().listResponses(form.id);
  const { header, rows } = toSheet(form, responses);
  return (
    <AppShell name={user.name}>
      <FormTabs id={form.id} title={form.title} active="responses" />
      <ResponseSheet formId={form.id} header={header} rows={rows.map((cells, i) => ({ id: responses[i].id, cells }))} />
    </AppShell>
  );
}
