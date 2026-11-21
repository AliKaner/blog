"use client";

import { useEffect, useRef } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { JourneyTimeline } from "./JourneyTimeline";
import type { FeedItemType } from "@/lib/feedTypes";
import { PAGE_SIZE } from "@/lib/pagination";
import type { ListSort } from "@/lib/listParams";

/** Filter args passed straight to movies.page / books.page. */
export type ListArgs = { sort?: ListSort; rating?: number; search?: string };


type TimelineItem = {
  type: FeedItemType;
  id: string;
  slug: string;
  title: string;
  date: number;
  rating?: number | null;
  imageUrl?: string | null;
};

type Status = "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";

/**
 * A timeline that grows as the visitor scrolls: the server renders the
 * first page (fast, crawlable), then Convex pagination fetches PAGE_SIZE
 * more each time the end comes into view. Never loads the whole
 * collection at once.
 */
function GrowingTimeline({
  items,
  status,
  loadMore,
  total,
  noun,
}: {
  items: TimelineItem[];
  status: Status;
  loadMore: (n: number) => void;
  total: number | null;
  noun: string;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const canLoad = status === "CanLoadMore";

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !canLoad) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore(PAGE_SIZE);
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canLoad, loadMore]);

  if (items.length === 0 && status !== "LoadingFirstPage") {
    return <p className="text-ink-soft">Nothing matches — try another rating or search.</p>;
  }

  return (
    <div>
      <JourneyTimeline items={items} />
      <div ref={sentinel} className="mt-10 flex flex-col items-center gap-3 text-center">
        {total !== null && (
          <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            {items.length.toLocaleString("en")} of {total.toLocaleString("en")} {noun}
          </p>
        )}
        {status === "LoadingMore" && <p className="text-sm text-ink-soft">Loading more…</p>}
        {canLoad && (
          <button type="button" onClick={() => loadMore(PAGE_SIZE)} className="btn px-4 py-2 text-xs">
            Load more
          </button>
        )}
      </div>
    </div>
  );
}

type MoviePage = {
  _id: string;
  slug: string;
  title: string;
  year: number | null;
  rating: number | null;
  watchedAt: number;
  posterUrl: string | null;
};

const movieItem = (m: MoviePage): TimelineItem => ({
  type: "movie",
  id: m._id,
  slug: m.slug,
  title: m.year ? `${m.title} (${m.year})` : m.title,
  date: m.watchedAt,
  rating: m.rating,
  imageUrl: m.posterUrl,
});

export function MoviesTimeline({
  initial,
  total,
  args,
}: {
  initial: MoviePage[];
  total: number | null;
  args: ListArgs;
}) {
  const { results, status, loadMore } = usePaginatedQuery(api.movies.page, args, { initialNumItems: PAGE_SIZE });
  // Until the live query answers, show what the server rendered.
  const items = (status === "LoadingFirstPage" ? initial : results).map(movieItem);
  return <GrowingTimeline items={items} status={status} loadMore={loadMore} total={total} noun="films" />;
}

type BookPage = {
  _id: string;
  slug: string;
  title: string;
  author: string | null;
  rating: number | null;
  finishedAt: number;
  coverUrl: string | null;
};

const bookItem = (b: BookPage): TimelineItem => ({
  type: "book",
  id: b._id,
  slug: b.slug,
  title: b.author ? `${b.title} — ${b.author}` : b.title,
  date: b.finishedAt,
  rating: b.rating,
  imageUrl: b.coverUrl,
});

export function BooksTimeline({
  initial,
  total,
  args,
}: {
  initial: BookPage[];
  total: number | null;
  args: ListArgs;
}) {
  const { results, status, loadMore } = usePaginatedQuery(api.books.page, args, { initialNumItems: PAGE_SIZE });
  const items = (status === "LoadingFirstPage" ? initial : results).map(bookItem);
  return <GrowingTimeline items={items} status={status} loadMore={loadMore} total={total} noun="books" />;
}
