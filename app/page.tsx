import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { currentUser } from "@/lib/auth";

export default async function HomePage() {
  if (await currentUser()) redirect("/forms");
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Brand />
        <Link href="/login" className="btn btn-ghost">Sign in</Link>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-forest sm:text-5xl">
          Build a form. Share a link. Watch the answers add up.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Every response lands in a spreadsheet you can export, and on a dashboard that charts it for you.
        </p>
        <Link href="/signup" className="btn btn-primary">Create your first form</Link>
      </main>
    </div>
  );
}
