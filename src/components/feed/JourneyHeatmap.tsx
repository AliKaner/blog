import Link from "next/link";
import { YearHeatmap } from "@/components/components/library/YearHeatmap";
import { FEED_TYPE_LABEL, FEED_TYPE_PATH, type FeedItemType } from "@/lib/feedTypes";

type Item = { type: FeedItemType; title: string; slug: string; date: number };

/** The Journey's year grid: the copyable YearHeatmap (see /components) in
    the site's palette and type, each entry linking to its page. */
export function JourneyHeatmap({ items, now }: { items: Item[]; now: number }) {
  return (
    <YearHeatmap
      now={now}
      items={items.map((item) => ({
        date: item.date,
        label: item.title,
        group: FEED_TYPE_LABEL[item.type],
        href: `${FEED_TYPE_PATH[item.type]}/${item.slug}`,
      }))}
      LinkComponent={Link}
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
