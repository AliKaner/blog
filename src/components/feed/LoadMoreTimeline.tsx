"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PAGE_SIZE } from "@/lib/pagination";
import type { ListSort } from "@/lib/listParams";

/** Filter args passed straight to movies.page / books.page. */
export type ListArgs = { sort?: ListSort; rating?: number; search?: string };

export type WallItem = {
  id: string;
  href: string;
  title: string;
  /** year for films, author for books */
  sub: string | null;
  date: number;
  rating: number | null;
  imageUrl: string | null;
};

type Status = "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

/** How a view is sectioned: by month for date order, by rating band for
    rating order, not at all for search results (relevance order). */
function sectionKey(args: ListArgs) {
  if (args.search) return () => "";
  if (args.sort === "rating-desc" || args.sort === "rating-asc") {
    return (item: WallItem) => (item.rating === null ? "Unrated" : `Rated ${Math.floor(item.rating)}`);
  }
  return (item: WallItem) => MONTH.format(item.date);
}

function sections(items: WallItem[], key: (i: WallItem) => string) {
  const out: { title: string; items: WallItem[] }[] = [];
  for (const item of items) {
    const title = key(item);
    const last = out[out.length - 1];
    if (last && last.title === title) last.items.push(item);
    else out.push({ title, items: [item] });
  }
  return out;
}

/** One small framed poster/cover with its caption. Without an image, a
    paper plate carries the title in inscription capitals instead. */
function WallCard({ item }: { item: WallItem }) {
  return (
    <Link href={item.href} className="group block no-underline">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          className="frame frame-sm aspect-[2/3] w-full object-cover transition-[filter] duration-200 group-hover:brightness-105"
        />
      ) : (
        <div className="frame frame-sm flex aspect-[2/3] w-full items-center justify-center p-2 text-center">
          <span className="line-clamp-4 font-heading text-[11px] leading-snug tracking-wide text-accent">
            {item.title}
          </span>
        </div>
      )}
      <p className="mt-2 line-clamp-2 text-[13px] leading-tight text-ink transition-colors group-hover:text-accent">
        {item.title}
      </p>
      <p className="mt-0.5 truncate font-mono text-[10px] text-ink-soft">
        {[item.sub, item.rating !== null ? `${item.rating}/10` : null].filter(Boolean).join(" · ")}
      </p>
    </Link>
  );
}

/** A rating band drawn as a tiny engraved scale: ten ticks on a hairline,
    the ones up to the band inked in burgundy. */
function BandScale({ band }: { band: number }) {
  return (
    <span aria-hidden className="flex items-end gap-[3px] border-b border-ink-soft/40 pb-px">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`w-px ${i === 4 || i === 9 ? "h-2" : "h-1.5"} ${i < band ? "bg-accent" : "bg-ink-soft/35"}`}
        />
      ))}
    </span>
  );
}

/** Section heading: the title, a double rule running out to a small
    rosette, and the section's count in italics. */
function WallHeading({ title, count, noun }: { title: string; count: number; noun?: string }) {
  const band = /^Rated (\d+)$/.exec(title)?.[1];
  return (
    <h2 className="mb-4 flex items-center gap-3 font-heading text-[11px] uppercase tracking-[0.18em] text-ink-soft">
      <span className="shrink-0">{title}</span>
      {band !== undefined && <BandScale band={Number(band)} />}
      <span aria-hidden className="h-[3px] flex-1 border-y border-border" />
      <span aria-hidden className="text-[10px] tracking-normal text-accent/70">❦</span>
      <span className="shrink-0 font-accent text-[13px] normal-case italic tracking-normal">
        {count.toLocaleString("en")}
        {noun ? ` ${count === 1 ? noun.replace(/s$/, "") : noun}` : ""}
      </span>
    </h2>
  );
}

/** The wall itself: items sectioned by month or rating, six to a row. */
export function PosterWall({ items, args, noun }: { items: WallItem[]; args: ListArgs; noun?: string }) {
  return (
    <div className="flex flex-col gap-10">
      {sections(items, sectionKey(args)).map((section, i) => (
        <section key={`${section.title}-${i}`}>
          {section.title && <WallHeading title={section.title} count={section.items.length} noun={noun} />}
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
            {section.items.map((item) => (
              <WallCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}


/**
 * A dense wall of posters that grows as the visitor scrolls: the server
 * renders the first page (fast, crawlable), then Convex pagination
 * fetches PAGE_SIZE more each time the end comes into view. Never loads
 * the whole collection at once.
 */
function GrowingWall({
  items,
  args,
  status,
  loadMore,
  total,
  noun,
}: {
  items: WallItem[];
  args: ListArgs;
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
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canLoad, loadMore]);

  if (items.length === 0 && status !== "LoadingFirstPage") {
    return <p className="text-ink-soft">Nothing matches — try another rating or search.</p>;
  }

  return (
    <div>
      <PosterWall items={items} args={args} noun={noun} />
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

const movieItem = (m: MoviePage): WallItem => ({
  id: m._id,
  href: `/movies/${m.slug}`,
  title: m.title,
  sub: m.year ? String(m.year) : null,
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
  return <GrowingWall items={items} args={args} status={status} loadMore={loadMore} total={total} noun="films" />;
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

const bookItem = (b: BookPage): WallItem => ({
  id: b._id,
  href: `/books/${b.slug}`,
  title: b.title,
  sub: b.author,
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
  return <GrowingWall items={items} args={args} status={status} loadMore={loadMore} total={total} noun="books" />;
}
