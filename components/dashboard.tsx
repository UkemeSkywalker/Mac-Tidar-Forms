import type { Summary } from "@/lib/analytics";

const format = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 1 });

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function DailyChart({ days }: { days: { date: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <figure className="card p-5">
      <figcaption className="text-sm font-medium">Responses per day, last 30 days (UTC)</figcaption>
      <div className="mt-4 flex h-40 items-end gap-0.5 border-b border-line">
        {days.map((d) => (
          <div key={d.date} tabIndex={0} aria-label={`${d.date}: ${d.count}`} className="group relative flex h-full flex-1 items-end outline-none hover:bg-mint-soft focus:bg-mint-soft">
            <div className="w-full rounded-t bg-forest-soft" style={{ height: `${(d.count / max) * 100}%` }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-paper group-hover:block group-focus:block">
              {d.date}: {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{days[0].date}</span>
        <span>{days[days.length - 1].date}</span>
      </div>
    </figure>
  );
}

export function QuestionCard({ summary }: { summary: Summary }) {
  return (
    <section className="card p-5">
      <h3 className="font-medium">{summary.field.label}</h3>
      <p className="mb-4 text-sm text-muted">
        {summary.answered} {summary.answered === 1 ? "answer" : "answers"}
        {summary.kind === "bars" && summary.average !== undefined && ` · average ${format(summary.average)} of 5`}
      </p>
      {summary.kind === "bars" && (
        <ul className="space-y-3">
          {summary.bars.map((bar) => (
            <li key={bar.label} className="text-sm">
              <div className="mb-1 flex justify-between gap-3">
                <span className="truncate">{bar.label}</span>
                <span className="shrink-0 tabular-nums text-muted">{bar.count} · {bar.percent}%</span>
              </div>
              <div className="h-2 rounded bg-linen">
                <div className="h-2 rounded bg-forest-soft" style={{ width: `${bar.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {summary.kind === "number" && summary.answered > 0 && (
        <dl className="grid grid-cols-3 gap-3 text-center">
          {(["average", "min", "max"] as const).map((key) => (
            <div key={key}>
              <dt className="text-xs capitalize text-muted">{key}</dt>
              <dd className="text-xl font-semibold tabular-nums">{format(summary[key])}</dd>
            </div>
          ))}
        </dl>
      )}
      {summary.kind === "list" && (
        <ul className="divide-y divide-line text-sm">
          {summary.latest.map((value, i) => <li key={i} className="truncate py-1.5" title={value}>{value}</li>)}
        </ul>
      )}
    </section>
  );
}
