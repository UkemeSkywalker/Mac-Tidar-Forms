import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FormBuilder } from "@/components/form-builder";
import { FormTabs } from "@/components/form-tabs";
import { ownedForm, requireUser } from "@/lib/auth";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const form = await ownedForm((await params).id, user);
  if (!form) notFound();
  return (
    <AppShell name={user.name}>
      <FormTabs id={form.id} title={form.title} active="edit" />
      <FormBuilder form={form} />
    </AppShell>
  );
}
