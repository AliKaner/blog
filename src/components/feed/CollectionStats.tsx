/* The "dashboard" plate at the top of Movies / Books: headline figures and
   two small column charts, all read from the precomputed collectionStats
   row (refreshed from the admin) — never from the full collection. */

type Stats = {
  total: number;
  thisYear: number;
  rated: number;
  ratingSum: number;
  ratingHistogram: number[];
  perMonth: { month: string; count: number }[];
  perDecade: { decade: number; count: number }[];
  refreshedAt: number;
};

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const MONTH_YEAR = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

const monthDate = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (mo ?? 1) - 1, 1));
};

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-heading text-[10px] uppercase tracking-[0.18em] text-ink-soft">{label}</span>
      <span className="mt-1 font-heading text-3xl leading-none text-ink">{value}</span>
      {note && <span className="mt-1 font-accent text-sm italic text-ink-soft">{note}</span>}
    </div>
  );
}

/** Single-series column chart: thin burgundy columns with a 2px gap, a
    hairline baseline, sparse axis labels, a value label on hover, and a
    visually hidden table for screen readers. */
function Columns({
  title,
  bars,
  axis,
}: {
  title: string;
  bars: { label: string; value: number }[];
  /** indexes of bars whose label is printed under the axis */
  axis: number[];
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <figure className="flex min-w-0 flex-col">
      <figcaption className="font-heading text-[10px] uppercase tracking-[0.18em] text-ink-soft">{title}</figcaption>
      <div aria-hidden className="mt-3 flex h-24 items-end gap-[2px] border-b border-border">
        {bars.map((b) => (
          <div key={b.label} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[2px] bg-accent/85 transition-colors group-hover:bg-accent-2"
              style={{ height: b.value === 0 ? 0 : `max(2px, ${(b.value / max) * 100}%)` }}
            />
            <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-ink group-hover:block">
              {b.label}: {b.value}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-1 flex gap-[2px]">
        {bars.map((b, i) => (
          <span key={b.label} className="flex-1 text-center font-mono text-[9px] text-ink-soft">
            {axis.includes(i) ? b.label : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.label}>
              <th scope="row">{b.label}</th>
              <td>{b.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function CollectionStats({ stats, noun }: { stats: Stats | null; noun: string }) {
  if (!stats || stats.total === 0) return null;

  const average = stats.rated > 0 ? stats.ratingSum / stats.rated : null;
  const topDecade = [...stats.perDecade].sort((a, b) => b.count - a.count)[0];

  const months = stats.perMonth.map((m) => ({
    label: MONTH.format(monthDate(m.month)),
    value: m.count,
    full: MONTH_YEAR.format(monthDate(m.month)),
  }));
  const ratings = stats.ratingHistogram.map((count, rating) => ({ label: String(rating), value: count }));

  return (
    <section aria-label={`${noun} statistics`} className="panel p-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Figure label="In total" value={stats.total.toLocaleString("en")} note={noun} />
        <Figure label="This year" value={stats.thisYear.toLocaleString("en")} />
        <Figure
          label="Average"
          value={average === null ? "—" : average.toFixed(1)}
          note={average === null ? undefined : `out of 10 · ${stats.rated.toLocaleString("en")} rated`}
        />
        {topDecade ? (
          <Figure label="Favourite decade" value={`${topDecade.decade}s`} note={`${topDecade.count} ${noun}`} />
        ) : (
          <Figure label="Rated" value={stats.rated.toLocaleString("en")} />
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <Columns
          title="Last 12 months"
          bars={months.map((m) => ({ label: m.label, value: m.value }))}
          axis={[0, 5, 11]}
        />
        <Columns title="Ratings" bars={ratings} axis={[0, 5, 10]} />
      </div>

      <p className="mt-5 text-right font-mono text-[10px] text-ink-soft">
        Figures as of {DAY.format(stats.refreshedAt)}
      </p>
    </section>
  );
}
