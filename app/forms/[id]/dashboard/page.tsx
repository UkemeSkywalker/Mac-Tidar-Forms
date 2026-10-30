import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DailyChart, QuestionCard, StatTile } from "@/components/dashboard";
import { FormTabs } from "@/components/form-tabs";
import { dailyCounts, summarize } from "@/lib/analytics";
import { ownedForm, requireUser } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const form = await ownedForm((await params).id, user);
  if (!form) notFound();
  const responses = await store().listResponses(form.id);
  const days = dailyCounts(responses);
  const last7 = days.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const latest = responses.at(-1)?.submittedAt.slice(0, 10) ?? "None yet";

  return (
    <AppShell name={user.name}>
      <FormTabs id={form.id} title={form.title} active="dashboard" />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Total responses" value={String(responses.length)} />
          <StatTile label="Last 7 days" value={String(last7)} />
          <StatTile label="Latest response" value={latest} />
        </div>
        <DailyChart days={days} />
        <div className="grid gap-4 md:grid-cols-2">
          {form.fields.map((field) => <QuestionCard key={field.id} summary={summarize(field, responses)} />)}
        </div>
      </div>
    </AppShell>
  );
}
