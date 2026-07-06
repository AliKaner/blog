import { formatDate } from "@/lib/format";
import type { FeedItemType } from "@/lib/feedTypes";

const START_YEAR = 2018;
const CELL = 13;
const WEEK_MS = 7 * 86_400_000;
const TOOLTIP_MAX = 6;

type Item = { type: FeedItemType; title: string; date: number };

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
  return new Date(weekStart + 4 * 86_400_000).getFullYear();
}

function cellColor(count: number): string {
  if (count <= 0) return "var(--card)";
  if (count === 1) return "color-mix(in srgb, var(--accent) 45%, var(--card))";
  if (count === 2) return "color-mix(in srgb, var(--accent) 75%, var(--card))";
  return "var(--accent)";
}

type Week = { start: number; items: Item[] };

export function JourneyHeatmap({
  items,
  now,
}: {
  items: Item[];
  now: number;
}) {
  const weekItems = new Map<number, Item[]>();
  for (const item of items) {
    const key = startOfWeek(item.date);
    const bucket = weekItems.get(key);
    if (bucket) bucket.push(item);
    else weekItems.set(key, [item]);
  }

  const firstWeek = startOfWeek(new Date(START_YEAR, 0, 1).getTime());
  const lastWeek = startOfWeek(now);

  // Bucket every week into its year. Weeks are visited in chronological
  // order so each year's row stays left-to-right January→December, while
  // the years themselves are rendered newest-first below.
  const years = new Map<number, Week[]>();
  let total = 0;
  for (let t = firstWeek; t <= lastWeek; t += WEEK_MS) {
    const weekItemList = weekItems.get(t) ?? [];
    total += weekItemList.length;
    const year = weekYear(t);
    const row = years.get(year);
    const week = { start: t, items: weekItemList };
    if (row) row.push(week);
    else years.set(year, [week]);
  }

  const yearRows = [...years.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div>
      <p className="font-mono text-xs text-ink-soft">
        {total} thing{total === 1 ? "" : "s"} since {START_YEAR}, one square
        per week
      </p>
      <div className="mt-4 flex flex-col gap-5">
        {yearRows.map(([year, weeks]) => (
          <div key={year}>
            <span className="font-mono text-xs text-ink-soft">{year}</span>
            <div className="mt-1.5 flex flex-wrap">
              {weeks.map((week) => (
                <Cell key={week.start} week={week} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ week }: { week: Week }) {
  const count = week.items.length;
  const weekEnd = week.start + WEEK_MS - 86_400_000;

  if (count === 0) {
    return (
      <div
        style={{ height: CELL, width: CELL, background: cellColor(0) }}
      />
    );
  }

  return (
    <div className="group relative hover:z-20" style={{ height: CELL, width: CELL }}>
      <div style={{ height: CELL, width: CELL, background: cellColor(count) }} />
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-56 -translate-x-1/2 group-hover:block">
        <div
          className="border border-border p-2.5"
          style={{ background: "var(--card)", boxShadow: "4px 4px 0 0 var(--accent)" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
            {formatDate(week.start)} – {formatDate(weekEnd)}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {week.items.slice(0, TOOLTIP_MAX).map((item, i) => (
              <li key={i} className="truncate text-xs text-ink">
                <span className="text-ink-soft">›</span> {item.title}
              </li>
            ))}
            {count > TOOLTIP_MAX && (
              <li className="text-xs text-ink-soft">
                +{count - TOOLTIP_MAX} more
              </li>
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
