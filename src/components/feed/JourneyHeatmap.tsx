import Link from "next/link";
import type { ComponentProps } from "react";
import { YearHeatmap, type YearHeatmapWeek } from "@/components/components/library/YearHeatmap";

/** Links in the grid: a week square keeps the scroll position (the list
    scrolls itself into view); entry links behave normally. */
function GridLink(props: ComponentProps<typeof Link> & { href: string }) {
  return <Link scroll={!props.href.startsWith("/journey?week=")} {...props} />;
}

/** The Journey's year grid: the copyable YearHeatmap (see /components) in
    the site's palette and type, fed from the precomputed weekly rows
    (convex/journey.ts). Clicking a square opens the list at that week. */
export function JourneyHeatmap({
  weeks,
  now,
  selectedWeek,
}: {
  weeks: { weekStart: number; count: number; groups: YearHeatmapWeek["groups"]; entries: YearHeatmapWeek["entries"] }[];
  now: number;
  selectedWeek: number | null;
}) {
  return (
    <YearHeatmap
      now={now}
      weeks={weeks.map((w) => ({ start: w.weekStart, count: w.count, groups: w.groups, entries: w.entries }))}
      weekHref={(start) => `/journey?week=${start}`}
      selectedWeek={selectedWeek ?? undefined}
      LinkComponent={GridLink}
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
