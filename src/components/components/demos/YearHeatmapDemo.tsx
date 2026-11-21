import { YearHeatmap, type YearHeatmapItem } from "../library/YearHeatmap";

const KINDS = ["Film", "Book", "Place", "Post"];
const TITLES = ["The Long Walk", "Salt and Stone", "Lisbon", "On Engraving", "Night Train", "Small Hours", "Kyoto", "Paper Cities"];

/** Three years of made-up entries, generated deterministically so server
    and client render the same grid. */
function sampleItems(now: number): YearHeatmapItem[] {
  const items: YearHeatmapItem[] = [];
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const start = new Date(new Date(now).getFullYear() - 2, 2, 1).getTime();
  for (let t = start; t < now; t += 86_400_000) {
    const busy = 0.6 + 0.4 * Math.sin(t / 2.6e9);
    const n = Math.floor(rnd() * 2.4 * busy);
    for (let i = 0; i < n; i++) {
      items.push({
        date: t,
        label: TITLES[Math.floor(rnd() * TITLES.length)] ?? "Untitled",
        group: KINDS[Math.floor(rnd() * KINDS.length)],
      });
    }
  }
  return items;
}

// A fixed "today" keeps the sample stable between renders.
const NOW = new Date(2026, 10, 15).getTime();
const ITEMS = sampleItems(NOW);

export function YearHeatmapDemo() {
  return (
    <YearHeatmap
      items={ITEMS}
      now={NOW}
      noun={["entry", "entries"]}
      theme={{
        accent: "var(--accent)",
        deep: "var(--accent-2)",
        surface: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--ink-soft)",
        displayFont: "var(--font-heading)",
        italicFont: "var(--font-accent)",
        monoFont: "var(--font-mono)",
      }}
    />
  );
}
