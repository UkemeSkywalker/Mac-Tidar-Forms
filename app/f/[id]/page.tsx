import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormRenderer } from "@/components/form-renderer";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/store";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const form = await store().getForm((await params).id);
  return { title: form?.published ? form.title : "Mac Tidar Forms", robots: { index: false } };
}

export default async function PublicFormPage({ params, searchParams }: Props) {
  const form = await store().getForm((await params).id);
  if (!form) notFound();

  const wantsPreview = (await searchParams).preview === "1";
  const user = wantsPreview ? await currentUser() : null;
  const preview = user?.id === form.ownerId;
  if (!form.published && !preview) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {preview && (
        <p className="mb-4 rounded-lg bg-mint-soft px-4 py-2 text-sm text-forest">
          Preview: responses can&apos;t be submitted from here.
        </p>
      )}
      <FormRenderer formId={form.id} title={form.title} description={form.description} fields={form.fields} preview={preview} />
      <p className="mt-8 text-center text-xs text-muted">Powered by Mac Tidar Forms</p>
    </main>
  );
}
