import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

/* The Journey page: a paginated, newest-first list merged from every
   published collection, and a heatmap read from precomputed weekly rows
   (journeyWeeks) rather than from every entry. */

type FeedType = "movie" | "place" | "book" | "softwareLog" | "post" | "cocktail";

const TYPES: FeedType[] = ["movie", "place", "book", "softwareLog", "post", "cocktail"];

const LABEL: Record<FeedType, string> = {
  movie: "Movie",
  place: "Place",
  book: "Book",
  softwareLog: "Dev Log",
  post: "Post",
  cocktail: "Cocktail",
};

const PATH: Record<FeedType, string> = {
  movie: "/movies",
  place: "/places",
  book: "/books",
  softwareLog: "/dev-log",
  post: "/posts",
  cocktail: "/cocktails",
};

/** Entries kept per week for the heatmap card. */
const WEEK_ENTRIES = 6;
const DAY = 86_400_000;
const MAX_PAGE = 50;

const feedItem = v.object({
  type: v.union(
    v.literal("movie"),
    v.literal("place"),
    v.literal("book"),
    v.literal("softwareLog"),
    v.literal("post"),
    v.literal("cocktail"),
  ),
  id: v.string(),
  slug: v.string(),
  title: v.string(),
  date: v.number(),
  excerpt: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  rating: v.union(v.number(), v.null()),
});

/** Where the next page starts: everything strictly older than `date`,
    plus anything at exactly `date` not yet shown (`seen`). */
const cursorValidator = v.union(v.null(), v.object({ date: v.number(), seen: v.array(v.string()) }));
type Cursor = { date: number; seen: string[] } | null;

type Slim = {
  type: FeedType;
  id: string;
  slug: string;
  title: string;
  date: number;
  excerpt: string | null;
  storageId: Id<"_storage"> | null;
  rating: number | null;
};

/** Up to `n` newest published rows of one collection at or before the
    cursor, slimmed to what the list shows. Reads at most n + 1 + seen rows. */
async function newest(ctx: QueryCtx, type: FeedType, cursor: Cursor, n: number): Promise<Slim[]> {
  const before = cursor?.date ?? Number.POSITIVE_INFINITY;
  // One extra, so the page can tell whether anything older remains.
  const take = n + 1 + (cursor?.seen.length ?? 0);
  switch (type) {
    case "movie": {
      const rows = await ctx.db
        .query("movies")
        .withIndex("by_published_watchedAt", (q) => q.eq("published", true).lte("watchedAt", before))
        .order("desc")
        .take(take);
      return rows.map((m) => ({
        type, id: m._id, slug: m.slug, title: m.title, date: m.watchedAt,
        excerpt: null, storageId: m.posterStorageId ?? null, rating: m.rating ?? null,
      }));
    }
    case "place": {
      const rows = await ctx.db
        .query("places")
        .withIndex("by_published_visitedAt", (q) => q.eq("published", true).lte("visitedAt", before))
        .order("desc")
        .take(take);
      return rows.map((p) => ({
        type, id: p._id, slug: p.slug, title: p.name, date: p.visitedAt,
        excerpt: p.description ?? null, storageId: p.photoStorageIds?.[0] ?? null, rating: null,
      }));
    }
    case "book": {
      const rows = await ctx.db
        .query("books")
        .withIndex("by_published_finishedAt", (q) => q.eq("published", true).lte("finishedAt", before))
        .order("desc")
        .take(take);
      return rows.map((b) => ({
        type, id: b._id, slug: b.slug, title: b.title, date: b.finishedAt,
        excerpt: null, storageId: b.coverStorageId ?? null, rating: b.rating ?? null,
      }));
    }
    case "softwareLog": {
      const rows = await ctx.db
        .query("softwareLogs")
        .withIndex("by_published_loggedAt", (q) => q.eq("published", true).lte("loggedAt", before))
        .order("desc")
        .take(take);
      return rows.map((l) => ({
        type, id: l._id, slug: l.slug, title: l.title, date: l.loggedAt,
        excerpt: l.body.slice(0, 200), storageId: null, rating: null,
      }));
    }
    case "post": {
      const rows = await ctx.db
        .query("posts")
        .withIndex("by_published_publishedAt", (q) => q.eq("published", true).lte("publishedAt", before))
        .order("desc")
        .take(take);
      return rows.map((p) => ({
        type, id: p._id, slug: p.slug, title: p.title, date: p.publishedAt,
        excerpt: p.body.slice(0, 200), storageId: p.coverStorageId ?? null, rating: null,
      }));
    }
    case "cocktail": {
      const rows = await ctx.db
        .query("cocktails")
        .withIndex("by_published_triedAt", (q) => q.eq("published", true).lte("triedAt", before))
        .order("desc")
        .take(take);
      return rows.map((c) => ({
        type, id: c._id, slug: c.slug, title: c.title, date: c.triedAt,
        excerpt: null, storageId: c.imageStorageId ?? null, rating: c.rating ?? null,
      }));
    }
  }
}

/** One page of the Journey list, newest first, across every collection.
    Each collection is read only as far as the page needs, and image URLs
    are signed only for the items returned. */
export const page = query({
  args: { cursor: cursorValidator, limit: v.number() },
  returns: v.object({ items: v.array(feedItem), next: cursorValidator }),
  handler: async (ctx, { cursor, limit }) => {
    const n = Math.max(1, Math.min(MAX_PAGE, Math.floor(limit)));
    const seen = new Set(cursor?.seen ?? []);
    const merged = (await Promise.all(TYPES.map((t) => newest(ctx, t, cursor, n))))
      .flat()
      .filter((row) => !(cursor && row.date === cursor.date && seen.has(row.id)))
      .sort((a, b) => b.date - a.date || a.id.localeCompare(b.id));
    const pageRows = merged.slice(0, n);

    const items = await Promise.all(
      pageRows.map(async ({ storageId, ...row }) => ({
        ...row,
        imageUrl: storageId ? await ctx.storage.getUrl(storageId) : null,
      })),
    );

    const last = pageRows[pageRows.length - 1];
    let next: Cursor = null;
    if (last && merged.length > n) {
      // Carry over the ids already shown at the boundary date.
      const atLast = pageRows.filter((r) => r.date === last.date).map((r) => r.id);
      next = {
        date: last.date,
        seen: cursor && cursor.date === last.date ? [...cursor.seen, ...atLast] : atLast,
      };
    }
    return { items, next };
  },
});

/** The heatmap's weekly rows, oldest first. Small: one per active week. */
export const weeks = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("journeyWeeks").withIndex("by_weekStart").take(2000);
    return rows.map(({ weekStart, count, groups, entries }) => ({ weekStart, count, groups, entries }));
  },
});

/** When the weekly rows were last rebuilt, and how much they hold. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("journeyWeeks").withIndex("by_weekStart").take(2000);
    const first = rows[0];
    if (!first) return null;
    return {
      weeks: rows.length,
      total: rows.reduce((n, r) => n + r.count, 0),
      refreshedAt: first.refreshedAt,
    };
  },
});

/** Sunday 00:00 UTC of the week holding `t`. */
function weekStartUTC(t: number): number {
  const d = new Date(t);
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return midnight - d.getUTCDay() * DAY;
}

type Entry = { date: number; label: string; href: string; group: string };

/** Stream every published row once (fields only) and rewrite the weekly
    table. */
async function rebuildWeeks(ctx: MutationCtx) {
  const now = Date.now();
  const buckets = new Map<number, Entry[]>();
  const add = (type: FeedType, date: number, label: string, slug: string) => {
    const key = weekStartUTC(date);
    const entry = { date, label, href: `${PATH[type]}/${slug}`, group: LABEL[type] };
    const bucket = buckets.get(key);
    if (bucket) bucket.push(entry);
    else buckets.set(key, [entry]);
  };

  for await (const m of ctx.db.query("movies").withIndex("by_published_watchedAt", (q) => q.eq("published", true)))
    add("movie", m.watchedAt, m.title, m.slug);
  for await (const p of ctx.db.query("places").withIndex("by_published_visitedAt", (q) => q.eq("published", true)))
    add("place", p.visitedAt, p.name, p.slug);
  for await (const b of ctx.db.query("books").withIndex("by_published_finishedAt", (q) => q.eq("published", true)))
    add("book", b.finishedAt, b.title, b.slug);
  for await (const l of ctx.db.query("softwareLogs").withIndex("by_published_loggedAt", (q) => q.eq("published", true)))
    add("softwareLog", l.loggedAt, l.title, l.slug);
  for await (const p of ctx.db.query("posts").withIndex("by_published_publishedAt", (q) => q.eq("published", true)))
    add("post", p.publishedAt, p.title, p.slug);
  for await (const c of ctx.db.query("cocktails").withIndex("by_published_triedAt", (q) => q.eq("published", true)))
    add("cocktail", c.triedAt, c.title, c.slug);

  // Replace the table wholesale: it is small (one row per active week).
  for await (const row of ctx.db.query("journeyWeeks")) await ctx.db.delete("journeyWeeks", row._id);

  let total = 0;
  for (const [weekStart, entries] of buckets) {
    entries.sort((a, b) => b.date - a.date);
    const groups = new Map<string, number>();
    for (const e of entries) groups.set(e.group, (groups.get(e.group) ?? 0) + 1);
    total += entries.length;
    await ctx.db.insert("journeyWeeks", {
      weekStart,
      count: entries.length,
      groups: [...groups].map(([group, count]) => ({ group, count })).sort((a, b) => b.count - a.count),
      entries: entries.slice(0, WEEK_ENTRIES).map(({ label, href, group }) => ({ label, href, group })),
      refreshedAt: now,
    });
  }
  return { weeks: buckets.size, total, refreshedAt: now };
}

export const refresh = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return rebuildWeeks(ctx);
  },
});

/** Same rebuild for background jobs (scheduled after stats refreshes). */
export const recompute = internalMutation({
  args: {},
  handler: async (ctx) => {
    await rebuildWeeks(ctx);
  },
});
