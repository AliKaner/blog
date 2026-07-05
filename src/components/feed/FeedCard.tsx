import Link from "next/link";
import { formatDate } from "@/lib/format";
import { FEED_TYPE_LABEL, FEED_TYPE_PATH, type FeedItemType } from "@/lib/feedTypes";

type FeedCardProps = {
  type: FeedItemType;
  slug: string;
  title: string;
  date: number;
  excerpt?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
};

export function FeedCard({
  type,
  slug,
  title,
  date,
  excerpt,
  imageUrl,
  rating,
}: FeedCardProps) {
  const href = `${FEED_TYPE_PATH[type]}/${slug}`;
  return (
    <Link
      href={href}
      className="flex gap-4 rounded-sm border border-border bg-card p-4 no-underline transition hover:border-accent"
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-20 w-14 shrink-0 rounded-sm border border-border object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-accent">
          <span>{FEED_TYPE_LABEL[type]}</span>
          <span className="text-ink-soft">·</span>
          <span className="text-ink-soft">{formatDate(date)}</span>
          {typeof rating === "number" && (
            <>
              <span className="text-ink-soft">·</span>
              <span className="text-ink-soft">{rating}/10</span>
            </>
          )}
        </div>
        <h3 className="mt-1 truncate font-heading text-lg text-ink">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{excerpt}</p>
        )}
      </div>
    </Link>
  );
}
