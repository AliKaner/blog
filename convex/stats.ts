import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireAdmin } from "./lib/requireAdmin";

const kind = v.union(v.literal("movies"), v.literal("books"));
type Kind = "movies" | "books";

type Row = { date: number; rating?: number; year?: number };

/** Read every published row once, keeping only the fields the summary
    needs. Streams through the index rather than collecting documents. */
async function publishedRows(ctx: MutationCtx, k: Kind): Promise<Row[]> {
  const rows: Row[] = [];
  if (k === "movies") {
    const q = ctx.db
      .query("movies")
      .withIndex("by_published_watchedAt", (q) => q.eq("published", true));
    for await (const m of q) rows.push({ date: m.watchedAt, rating: m.rating, year: m.year });
  } else {
    const q = ctx.db
      .query("books")
      .withIndex("by_published_finishedAt", (q) => q.eq("published", true));
    for await (const b of q) rows.push({ date: b.finishedAt, rating: b.rating });
  }
  return rows;
}

const monthKey = (t: number) => {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

function summarise(rows: Row[], now: number) {
  const currentYear = new Date(now).getUTCFullYear();

  const histogram = Array.from({ length: 11 }, () => 0);
  let rated = 0;
  let ratingSum = 0;
  let thisYear = 0;
  const years = new Map<number, number>();
  const months = new Map<string, number>();
  const decades = new Map<number, number>();

  for (const row of rows) {
    const year = new Date(row.date).getUTCFullYear();
    if (year === currentYear) thisYear++;
    years.set(year, (years.get(year) ?? 0) + 1);
    const mk = monthKey(row.date);
    months.set(mk, (months.get(mk) ?? 0) + 1);
    if (typeof row.rating === "number") {
      rated++;
      ratingSum += row.rating;
      // whole-number bands (8 = 8.0–8.9), matching the list's rating filter
      const bucket = Math.min(10, Math.max(0, Math.floor(row.rating)));
      histogram[bucket] = (histogram[bucket] ?? 0) + 1;
    }
    if (typeof row.year === "number") {
      const decade = Math.floor(row.year / 10) * 10;
      decades.set(decade, (decades.get(decade) ?? 0) + 1);
    }
  }

  // The 12 calendar months ending with the current one, zeros included.
  const perMonth: { month: string; count: number }[] = [];
  const d = new Date(now);
  for (let i = 11; i >= 0; i--) {
    const m = monthKey(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    perMonth.push({ month: m, count: months.get(m) ?? 0 });
  }

  return {
    total: rows.length,
    thisYear,
    rated,
    ratingSum,
    ratingHistogram: histogram,
    perMonth,
    perYear: [...years].map(([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year),
    perDecade: [...decades]
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => a.decade - b.decade),
  };
}

/** Rebuild one collection's summary. Admin-only; called from the admin
    "Refresh stats" button. Reads each published row once. */
async function rebuild(ctx: MutationCtx, k: Kind) {
  const now = Date.now();
  const summary = summarise(await publishedRows(ctx, k), now);
  const existing = await ctx.db
    .query("collectionStats")
    .withIndex("by_kind", (q) => q.eq("kind", k))
    .unique();
  const doc = { kind: k, ...summary, refreshedAt: now };
  if (existing) await ctx.db.replace("collectionStats", existing._id, doc);
  else await ctx.db.insert("collectionStats", doc);
  return { total: summary.total, refreshedAt: now };
}

export const refresh = mutation({
  args: { token: v.string(), kind },
  handler: async (ctx, { token, kind: k }) => {
    await requireAdmin(ctx, token);
    return rebuild(ctx, k);
  },
});

/** Same rebuild, for background jobs (e.g. after "Publish all" finishes). */
export const recompute = internalMutation({
  args: { kind },
  handler: async (ctx, { kind: k }) => {
    await rebuild(ctx, k);
  },
});

/** The stored summary for a collection, or null if never refreshed. */
export const get = query({
  args: { kind },
  handler: async (ctx, { kind: k }) => {
    return await ctx.db
      .query("collectionStats")
      .withIndex("by_kind", (q) => q.eq("kind", k))
      .unique();
  },
});
