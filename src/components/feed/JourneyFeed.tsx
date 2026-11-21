"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { JOURNEY_PAGE } from "@/lib/pagination";
import { JourneyTimeline } from "./JourneyTimeline";

type Page = FunctionReturnType<typeof api.journey.page>;
type Cursor = Page["next"];

const WEEK = 7 * 86_400_000;
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * The Journey list, twenty at a time: the server renders the first page,
 * then the next twenty load as the end comes into view (a "Load more"
 * button stays as a fallback). With a week chosen in the heatmap the list
 * starts at that week — its entries marked — and carries on into the past.
 */
export function JourneyFeed({ first, week }: { first: Page; week: number | null }) {
  const convex = useConvex();
  const [items, setItems] = useState(first.items);
  const [next, setNext] = useState<Cursor>(first.next);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!next || loading) return;
    setLoading(true);
    setError(false);
    try {
      const page = await convex.query(api.journey.page, { cursor: next, limit: JOURNEY_PAGE });
      setItems((prev) => [...prev, ...page.items]);
      setNext(page.next);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [convex, next, loading]);

  // Infinite scroll: fetch the next page well before the end is reached.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !next || error) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) void loadMore();
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [next, error, loadMore]);

  // Arriving from a heatmap square: bring the list into view.
  // (After the router's own scroll-to-top on navigation has run.)
  useEffect(() => {
    if (week === null) return;
    const id = setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => clearTimeout(id);
  }, [week]);

  const inWeek = week === null ? null : (date: number) => date >= week && date < week + WEEK;

  return (
    <div ref={top} className="scroll-mt-8">
      {week !== null && (
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[3px] border-double border-accent/40 pb-2">
          <p className="font-accent text-lg italic text-ink">
            From the week of {DATE.format(week)}
            <span className="text-ink-soft"> — and back from there</span>
          </p>
          <Link href="/journey" scroll={false} className="link-ornate font-accent text-base italic">
            Back to the latest
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-ink-soft">Nothing here yet.</p>
      ) : (
        <JourneyTimeline items={items} variant="plain" highlight={inWeek ?? undefined} />
      )}

      <div ref={sentinel} className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-[11px] text-ink-soft">
          {items.length.toLocaleString("en")} shown{next ? "" : " — that's everything"}
        </p>
        {next && (
          <button type="button" onClick={() => void loadMore()} disabled={loading} className="btn-orb" data-open={loading}>
            {loading ? "Loading…" : error ? "Try again" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
