import { FeedCard } from "./FeedCard";
import { dayKey, formatDate } from "@/lib/format";
import type { FeedItemType } from "@/lib/feedTypes";

type FeedItem = {
  type: FeedItemType;
  id: string;
  slug: string;
  title: string;
  date: number;
  excerpt?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
};

export function JourneyTimeline({
  items,
  variant = "line",
  highlight,
}: {
  items: FeedItem[];
  variant?: "line" | "plain";
  /** Marks the days it returns true for (e.g. a week picked in the heatmap). */
  highlight?: (date: number) => boolean;
}) {
  if (items.length === 0) return null;

  // Multiple entries can land on the same day — group them under one
  // timeline node instead of stacking duplicate dots for the same date.
  const groups: { key: string; date: number; items: FeedItem[] }[] = [];
  for (const item of items) {
    const key = dayKey(item.date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, date: item.date, items: [item] });
    }
  }

  const groupList = (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div
          key={group.key}
          className={[
            variant === "line" ? "relative pl-6" : "",
            highlight?.(group.date) ? "border-l-[3px] border-double border-accent pl-4" : "",
          ].join(" ")}
        >
          {variant === "line" && (
            <div
              className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2"
              style={{ borderColor: "var(--accent)", background: "var(--paper)" }}
            />
          )}
          <p className="font-mono text-xs uppercase tracking-wide text-accent">
            {formatDate(group.date)}
            {group.items.length > 1 && (
              <span className="ml-2 text-ink-soft">
                · {group.items.length} things
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-col gap-3">
            {group.items.map((item) => (
              <FeedCard key={`${item.type}-${item.id}`} {...item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (variant === "plain") return groupList;

  return (
    <div className="relative">
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
      {groupList}
    </div>
  );
}
