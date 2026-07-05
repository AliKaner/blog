import { formatDate } from "@/lib/format";

const START_YEAR = 2018;
const CELL = 12;
const GAP = 3;
const WEEK_MS = 7 * 86_400_000;

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

export function JourneyHeatmap({
  items,
  now,
}: {
  items: { date: number }[];
  now: number;
}) {
  const counts = new Map<number, number>();
  for (const item of items) {
    const key = startOfWeek(item.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const firstWeek = startOfWeek(new Date(START_YEAR, 0, 1).getTime());
  const lastWeek = startOfWeek(now);

  const weeks: { start: number; count: number }[] = [];
  for (let t = firstWeek; t <= lastWeek; t += WEEK_MS) {
    weeks.push({ start: t, count: counts.get(t) ?? 0 });
  }

  const total = weeks.reduce((sum, w) => sum + w.count, 0);

  return (
    <div>
      <p className="font-mono text-xs text-ink-soft">
        {total} thing{total === 1 ? "" : "s"} since {START_YEAR}, one square
        per week
      </p>
      <div className="mt-3 flex flex-wrap" style={{ gap: GAP }}>
        {weeks.map((week, i) => {
          const year = weekYear(week.start);
          const isFirstOfYear =
            i === 0 || weekYear(weeks[i - 1].start) !== year;
          const weekEnd = week.start + WEEK_MS - 86_400_000;
          return (
            <div key={week.start} className="contents">
              {isFirstOfYear && (
                <span className="mt-2 basis-full font-mono text-xs text-ink-soft first:mt-0">
                  {year}
                </span>
              )}
              <div
                title={`Week of ${formatDate(week.start)}–${formatDate(weekEnd)} · ${week.count} thing${week.count === 1 ? "" : "s"}`}
                style={{
                  height: CELL,
                  width: CELL,
                  borderRadius: 2,
                  background: cellColor(week.count),
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
