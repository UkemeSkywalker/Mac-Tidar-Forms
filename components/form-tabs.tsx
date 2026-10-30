import Link from "next/link";

const TABS = [
  ["edit", "Questions"],
  ["responses", "Spreadsheet"],
  ["dashboard", "Dashboard"],
] as const;

export function FormTabs({ id, title, active }: { id: string; title: string; active: (typeof TABS)[number][0] }) {
  return (
    <div className="mb-6">
      <Link href="/forms" className="text-sm text-muted hover:underline">← All forms</Link>
      <h1 className="mt-1 truncate text-2xl font-semibold">{title}</h1>
      <nav className="mt-4 flex gap-1 border-b border-line">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/forms/${id}/${key}`}
            aria-current={active === key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              active === key ? "border-forest text-forest" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
