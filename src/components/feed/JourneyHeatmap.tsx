import { dayKey, formatDate } from "@/lib/format";

const START_YEAR = 2018;
const CELL = 10;
const GAP = 2;

type Cell = { date: Date; key: string; count: number } | null;

function buildYearWeeks(year: number, counts: Map<string, number>): Cell[][] {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const startPad = jan1.getDay();
  const totalDays =
    Math.round((dec31.getTime() - jan1.getTime()) / 86_400_000) + 1;

  const cells: Cell[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(year, 0, 1 + d);
    const key = dayKey(date.getTime());
    cells.push({ date, key, count: counts.get(key) ?? 0 });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function cellColor(count: number): string {
  if (count <= 0) return "var(--card)";
  if (count === 1) return "color-mix(in srgb, var(--accent) 45%, var(--card))";
  if (count === 2) return "color-mix(in srgb, var(--accent) 75%, var(--card))";
  return "var(--accent)";
}

function YearGrid({
  year,
  counts,
}: {
  year: number;
  counts: Map<string, number>;
}) {
  const weeks = buildYearWeeks(year, counts);
  const monthLabels: { col: number; label: string }[] = [];
  weeks.forEach((week, col) => {
    const firstOfMonth = week.find((c) => c && c.date.getDate() === 1);
    if (firstOfMonth) {
      monthLabels.push({
        col,
        label: firstOfMonth.date.toLocaleDateString("en-US", {
          month: "short",
        }),
      });
    }
  });

  const total = weeks.flat().reduce((sum, c) => sum + (c?.count ?? 0), 0);

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-lg text-ink">{year}</span>
        <span className="font-mono text-xs text-ink-soft">
          {total} thing{total === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-2 overflow-x-auto">
        <div
          className="relative"
          style={{ height: 14, width: weeks.length * (CELL + GAP) }}
        >
          {monthLabels.map((m) => (
            <span
              key={m.col}
              className="absolute font-mono text-[10px] text-ink-soft"
              style={{ left: m.col * (CELL + GAP) }}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div className="mt-1 flex" style={{ gap: GAP }}>
          {weeks.map((week, col) => (
            <div key={col} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((cell, row) => (
                <div
                  key={row}
                  title={
                    cell
                      ? `${formatDate(cell.date.getTime())} · ${cell.count} thing${cell.count === 1 ? "" : "s"}`
                      : undefined
                  }
                  style={{
                    height: CELL,
                    width: CELL,
                    borderRadius: 2,
                    background: cell ? cellColor(cell.count) : "transparent",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JourneyHeatmap({ items }: { items: { date: number }[] }) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = dayKey(item.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= START_YEAR; y--) years.push(y);

  return (
    <div className="flex flex-col gap-6">
      {years.map((year) => (
        <YearGrid key={year} year={year} counts={counts} />
      ))}
    </div>
  );
}
