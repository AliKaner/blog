"use client";

import { useState } from "react";

/* Collection figures for Movies / Books, read from the precomputed
   collectionStats row (refreshed from the admin) — never from the full
   collection. One quiet line of figures; the charts stay folded away
   behind a rosette, like the site's other orb buttons. */

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
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return MONTH.format(new Date(Date.UTC(y ?? 1970, (mo ?? 1) - 1, 1)));
};

/** One figure in the summary line: the number in inscription capitals,
    its meaning in italic. */
function Figure({ value, label }: { value: string; label: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-heading text-lg text-ink">{value}</span>{" "}
      <span className="font-accent text-base italic text-ink-soft">{label}</span>
    </span>
  );
}

const Dot = () => (
  <span aria-hidden className="text-accent/50">
    ·
  </span>
);

/** Single-series column chart whose columns are little classical pillars.
    Value label on hover; a visually hidden table for screen readers. */
function PillarChart({
  title,
  bars,
  axis,
}: {
  title: string;
  bars: { label: string; value: number }[];
  /** indexes whose label is printed under the axis */
  axis: number[];
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <figure className="flex w-full max-w-xs flex-col">
      <figcaption className="font-heading text-[10px] uppercase tracking-[0.18em] text-ink-soft">{title}</figcaption>
      <div aria-hidden className="mt-3 flex h-16 items-end gap-[3px] border-b border-border">
        {bars.map((b) => (
          <div key={b.label} className="group relative flex h-full flex-1 items-end">
            {b.value > 0 && (
              <div className="w-full" style={{ height: `max(9px, ${(b.value / max) * 100}%)` }}>
                <div className="stat-pillar">
                  <span className="stat-pillar-capital" />
                  <span className="stat-pillar-echinus" />
                  <span className="stat-pillar-shaft flex-1" />
                  <span className="stat-pillar-base" />
                </div>
              </div>
            )}
            <span className="pointer-events-none absolute -top-5 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-ink group-hover:block">
              {b.label}: {b.value}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-1 flex gap-[3px]">
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
  const [open, setOpen] = useState(false);
  if (!stats || stats.total === 0) return null;

  const average = stats.rated > 0 ? stats.ratingSum / stats.rated : null;
  const topDecade = [...stats.perDecade].sort((a, b) => b.count - a.count)[0];
  const chartsId = `${noun}-charts`;

  return (
    <section aria-label={`${noun} statistics`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Figure value={stats.total.toLocaleString("en")} label={noun} />
        <Dot />
        <Figure value={stats.thisYear.toLocaleString("en")} label="this year" />
        {average !== null && (
          <>
            <Dot />
            <Figure value={average.toFixed(1)} label="average" />
          </>
        )}
        {topDecade && (
          <>
            <Dot />
            <Figure value={`${topDecade.decade}s`} label={noun === "films" ? "most watched" : "most read"} />
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={chartsId}
          className="btn-orb ml-1"
        >
          {open ? "Hide charts" : "Charts"}
        </button>
      </div>

      {/* Folds open/closed by animating the grid row from 0fr to 1fr. */}
      <div
        id={chartsId}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="flex flex-wrap gap-x-12 gap-y-8 pb-2 pt-8">
            <PillarChart
              title="Last 12 months"
              bars={stats.perMonth.map((m) => ({ label: monthLabel(m.month), value: m.count }))}
              axis={[0, 5, 11]}
            />
            <PillarChart
              title="Ratings"
              bars={stats.ratingHistogram.map((count, rating) => ({ label: String(rating), value: count }))}
              axis={[0, 5, 10]}
            />
          </div>
          <p className="font-mono text-[10px] text-ink-soft">Figures as of {DAY.format(stats.refreshedAt)}</p>
        </div>
      </div>
    </section>
  );
}
