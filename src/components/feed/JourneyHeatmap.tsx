import { formatDate } from "@/lib/format";
import type { FeedItemType } from "@/lib/feedTypes";

const CELL = 9;
const CELL_GAP = 2;
const STEP = CELL + CELL_GAP;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const TOOLTIP_MAX = 6;
/** A leading year is shown only once it holds at least this share of the
    busiest year's entries — a stray early entry doesn't open a run of
    empty rows. */
const SPARSE_SHARE = 0.05;
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

type Item = { type: FeedItemType; title: string; date: number };
type Week = { start: number; items: Item[] };

function startOfWeek(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

function weekYear(weekStart: number): number {
  // A week spanning a year boundary is attributed to whichever year
  // contains its Thursday (the same convention ISO week numbers use),
  // so a week that's mostly December doesn't get labeled with the
  // following year just because it starts a day or two early.
  return new Date(weekStart + 4 * DAY_MS).getFullYear();
}

/* One hue, light → dark: paper, then four steps of the accent mixed into
   the card, then the deep accent for the busiest weeks. */
const SHADES = [
  "var(--card)",
  "color-mix(in srgb, var(--accent) 22%, var(--card))",
  "color-mix(in srgb, var(--accent) 45%, var(--card))",
  "color-mix(in srgb, var(--accent) 70%, var(--card))",
  "var(--accent)",
  "var(--accent-2)",
];

/** Bucket thresholds from the spread of non-empty weeks (quintiles), so
    the scale still separates quiet and busy weeks when most weeks hold
    several entries. Returns the lower bound of levels 1..5. */
function thresholds(counts: number[]): number[] {
  const sorted = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [1, 2, 3, 4, 5];
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 1;
  const out = [1];
  for (const p of [0.2, 0.4, 0.6, 0.8]) out.push(Math.max(q(p), (out[out.length - 1] ?? 1) + 1));
  return out;
}

function level(count: number, bounds: number[]): number {
  if (count <= 0) return 0;
  let l = 1;
  for (let i = 1; i < bounds.length; i++) if (count >= (bounds[i] ?? Infinity)) l = i + 1;
  return l;
}

export function JourneyHeatmap({ items, now }: { items: Item[]; now: number }) {
  const weekItems = new Map<number, Item[]>();
  const perYear = new Map<number, number>();
  for (const item of items) {
    const key = startOfWeek(item.date);
    const bucket = weekItems.get(key);
    if (bucket) bucket.push(item);
    else weekItems.set(key, [item]);
    const y = weekYear(key);
    perYear.set(y, (perYear.get(y) ?? 0) + 1);
  }

  // First year worth a row: the earliest one that isn't a stray.
  const busiest = Math.max(0, ...perYear.values());
  const nowYear = new Date(now).getFullYear();
  const startYear =
    [...perYear.entries()]
      .filter(([, n]) => n >= Math.max(1, busiest * SPARSE_SHARE))
      .map(([y]) => y)
      .sort((a, b) => a - b)[0] ?? nowYear;

  const firstWeek = startOfWeek(new Date(startYear, 0, 4).getTime());
  const lastWeek = startOfWeek(now);

  // Bucket every week into its year, left-to-right January → December;
  // the years themselves are rendered newest-first.
  const years = new Map<number, Week[]>();
  for (let t = firstWeek; t <= lastWeek; t += WEEK_MS) {
    const week = { start: t, items: weekItems.get(t) ?? [] };
    const year = weekYear(t);
    const row = years.get(year);
    if (row) row.push(week);
    else years.set(year, [week]);
  }
  const yearRows = [...years.entries()].sort((a, b) => b[0] - a[0]);
  const allWeeks = yearRows.flatMap(([, w]) => w);
  const total = allWeeks.reduce((n, w) => n + w.items.length, 0);
  const bounds = thresholds(allWeeks.map((w) => w.items.length));
  const maxWeeks = Math.max(53, ...yearRows.map(([, w]) => w.length));

  // Month initials over the grid, at the week each month starts in.
  const monthMarks = MONTHS.map((label, m) => {
    const jan = new Date(startYear, 0, 1).getTime();
    const day = (new Date(startYear, m, 1).getTime() - jan) / DAY_MS;
    return { label, left: Math.floor(day / 7) * STEP };
  });

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-mono text-xs text-ink-soft">
          {total.toLocaleString("en")} thing{total === 1 ? "" : "s"} since {startYear}, one square per week
        </p>
        <Legend bounds={bounds} />
      </div>

      <div className="mt-4 pb-1 max-md:overflow-x-auto">
        <div className="inline-flex flex-col" style={{ gap: CELL_GAP }}>
          {/* Month initials */}
          <div className="flex items-end gap-2" aria-hidden>
            <span className="w-9 shrink-0" />
            <div className="relative h-4" style={{ width: maxWeeks * STEP }}>
              {monthMarks.map((m, i) => (
                <span
                  key={i}
                  className="absolute bottom-0.5 font-accent text-[11px] italic leading-none text-ink-soft"
                  style={{ left: m.left }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {yearRows.map(([year, weeks]) => {
            const yearTotal = weeks.reduce((n, w) => n + w.items.length, 0);
            return (
              <div key={year} className="flex items-center gap-2">
                <span className="w-9 shrink-0 font-mono text-xs text-ink-soft">{year}</span>
                <div className="flex" style={{ gap: CELL_GAP, width: maxWeeks * STEP }}>
                  {weeks.map((week) => (
                    <Cell key={week.start} week={week} shade={level(week.items.length, bounds)} />
                  ))}
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-soft">
                  {yearTotal.toLocaleString("en")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* The same numbers for screen readers. */}
      <table className="sr-only">
        <caption>Entries per year</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Entries</th>
            <th scope="col">Active weeks</th>
          </tr>
        </thead>
        <tbody>
          {yearRows.map(([year, weeks]) => (
            <tr key={year}>
              <th scope="row">{year}</th>
              <td>{weeks.reduce((n, w) => n + w.items.length, 0)}</td>
              <td>{weeks.filter((w) => w.items.length > 0).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "less ▢▢▢▢▢▢ more", each swatch titled with its range. */
function Legend({ bounds }: { bounds: number[] }) {
  const range = (l: number) => {
    if (l === 0) return "no entries";
    const lo = bounds[l - 1] ?? 1;
    const next = bounds[l];
    return next === undefined ? `${lo}+ a week` : next - 1 === lo ? `${lo} a week` : `${lo}–${next - 1} a week`;
  };
  return (
    <div className="flex items-center gap-1.5 font-accent text-xs italic text-ink-soft">
      <span>less</span>
      {SHADES.map((bg, l) => (
        <span
          key={l}
          title={range(l)}
          className="inline-block rounded-[2px]"
          style={{ width: CELL, height: CELL, background: bg }}
        />
      ))}
      <span>more</span>
    </div>
  );
}

function Cell({ week, shade }: { week: Week; shade: number }) {
  const count = week.items.length;
  const weekEnd = week.start + WEEK_MS - DAY_MS;
  const square = (
    <div className="rounded-[2px]" style={{ height: CELL, width: CELL, background: SHADES[shade] }} />
  );

  if (count === 0) return square;

  return (
    <div className="group relative hover:z-20" style={{ height: CELL, width: CELL }}>
      <div className="transition-transform group-hover:scale-125">{square}</div>
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-56 -translate-x-1/2 group-hover:block">
        <div className="panel-sm p-2.5 drop-shadow-[0_8px_12px_rgb(40_20_20/0.25)]">
          <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
            {formatDate(week.start)} – {formatDate(weekEnd)}
          </p>
          <p className="font-accent text-sm italic text-ink-soft">
            {count} {count === 1 ? "entry" : "entries"}
          </p>
          <ul className="mt-1 space-y-0.5">
            {week.items.slice(0, TOOLTIP_MAX).map((item, i) => (
              <li key={i} className="truncate text-xs text-ink">
                <span className="text-ink-soft">›</span> {item.title}
              </li>
            ))}
            {count > TOOLTIP_MAX && (
              <li className="text-xs text-ink-soft">+{count - TOOLTIP_MAX} more</li>
            )}
          </ul>
        </div>
        {/* Pointed tip keeping the app's square corners — a rotated
            square whose two visible edges continue the panel border. */}
        <div
          className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border"
          style={{ background: "var(--card)" }}
        />
      </div>
    </div>
  );
}
