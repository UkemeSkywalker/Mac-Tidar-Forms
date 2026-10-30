import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { NewFormButton } from "@/components/new-form-button";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function FormsPage() {
  const user = await requireUser();
  const forms = await store().listForms(user.id);
  return (
    <AppShell name={user.name}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your forms</h1>
        <NewFormButton />
      </div>
      {forms.length === 0 ? (
        <div className="card p-10 text-center text-muted">No forms yet. Create one to get a shareable link.</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <li key={form.id}>
              <Link href={`/forms/${form.id}/edit`} className="card block p-5 hover:border-forest-soft">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="truncate font-medium">{form.title}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${form.published ? "bg-mint text-forest" : "bg-line text-muted"}`}>
                    {form.published ? "Live" : "Draft"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {form.responseCount} {form.responseCount === 1 ? "response" : "responses"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
