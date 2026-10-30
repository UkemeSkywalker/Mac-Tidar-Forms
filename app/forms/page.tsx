import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function FormsPage() {
  const user = await requireUser();
  return (
    <AppShell name={user.name}>
      <h1 className="text-2xl font-semibold">Your forms</h1>
    </AppShell>
  );
}
