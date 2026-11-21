import { v } from "convex/values";
import { paginationOptsValidator, type PaginationResult } from "convex/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";
import { IMPORT_BATCH_LIMIT, slugify } from "./lib/slug";
import { listOptions } from "./lib/listOptions";
import type { Doc } from "./_generated/dataModel";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"books">,
) {
  const existing = await ctx.db
    .query("books")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== ignoreId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("books")
      .withIndex("by_published_finishedAt", (q) => q.eq("published", true))
      .order("desc")
      .collect();
    return Promise.all(
      rows.map(async (b) => ({
        ...b,
        coverUrl: b.coverStorageId
          ? await ctx.storage.getUrl(b.coverStorageId)
          : null,
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await ctx.db
      .query("books")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!book || !book.published) return null;
    return {
      ...book,
      coverUrl: book.coverStorageId
        ? await ctx.storage.getUrl(book.coverStorageId)
        : null,
    };
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("books").order("desc").collect();
    return Promise.all(
      rows.map(async (b) => ({
        ...b,
        coverUrl: b.coverStorageId
          ? await ctx.storage.getUrl(b.coverStorageId)
          : null,
      })),
    );
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    slug: v.string(),
    author: v.optional(v.string()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    finishedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("books", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("books"),
    title: v.string(),
    slug: v.string(),
    author: v.optional(v.string()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    finishedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Book not found");
    if (
      existing.coverStorageId &&
      existing.coverStorageId !== fields.coverStorageId
    ) {
      await ctx.storage.delete(existing.coverStorageId);
    }
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("books"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("books") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) return;
    if (existing.coverStorageId) {
      await ctx.storage.delete(existing.coverStorageId);
    }
    await ctx.db.delete(id);
  },
});

const bookListItem = async (ctx: QueryCtx, d: Doc<"books">) => ({
  _id: d._id,
  slug: d.slug,
  title: d.title,
  author: d.author ?? null,
  rating: d.rating ?? null,
  finishedAt: d.finishedAt,
  coverUrl: d.coverStorageId ? await ctx.storage.getUrl(d.coverStorageId) : null,
});

/**
 * One page of the public book list — only what the list shows (no review
 * text), with an image URL per row on that page only. Sort by date or
 * rating, narrow to one rating band, or search titles; each path uses an
 * index, so it stays fast however big the collection gets.
 *   - search: full-text on title (relevance order; rating still applies)
 *   - rating: rows rated r…r+0.9, newest first (oldest with sort=oldest)
 *   - sort=rating-desc/asc: rated rows only, by rating then date
 *   - otherwise: by date, newest first (or oldest)
 */
export const page = query({
  args: { paginationOpts: paginationOptsValidator, ...listOptions },
  handler: async (ctx, { paginationOpts, sort = "newest", rating, search }) => {
    const toPage = async (result: PaginationResult<Doc<"books">>) => ({
      ...result,
      page: await Promise.all(result.page.map((d) => bookListItem(ctx, d))),
    });

    const term = search?.trim();
    if (term) {
      return toPage(
        await ctx.db
          .query("books")
          .withSearchIndex("search_title", (q) => {
            const base = q.search("title", term).eq("published", true);
            return rating === undefined ? base : base.eq("rating", rating);
          })
          .paginate(paginationOpts),
      );
    }

    if (rating !== undefined) {
      return toPage(
        await ctx.db
          .query("books")
          .withIndex("by_published_rating_finishedAt", (q) =>
            q.eq("published", true).gte("rating", rating).lt("rating", rating + 1),
          )
          .order(sort === "oldest" ? "asc" : "desc")
          .paginate(paginationOpts),
      );
    }

    if (sort === "rating-desc" || sort === "rating-asc") {
      return toPage(
        await ctx.db
          .query("books")
          // gte(0) leaves out unrated rows, which would otherwise sort first
          .withIndex("by_published_rating_finishedAt", (q) => q.eq("published", true).gte("rating", 0))
          .order(sort === "rating-desc" ? "desc" : "asc")
          .paginate(paginationOpts),
      );
    }

    return toPage(
      await ctx.db
        .query("books")
        .withIndex("by_published_finishedAt", (q) => q.eq("published", true))
        .order(sort === "oldest" ? "asc" : "desc")
        .paginate(paginationOpts),
    );
  },
});

/** Slugs + last-modified for the sitemap: no storage lookups. Bounded. */
export const listSlugs = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("books")
      .withIndex("by_published_finishedAt", (q) => q.eq("published", true))
      .order("desc")
      .take(10_000);
    return rows.map((b) => ({ slug: b.slug, updatedAt: b.updatedAt }));
  },
});

/**
 * Bulk import (admin JSON upload). Inserts up to IMPORT_BATCH_LIMIT books
 * per call; the admin page sends a large file in batches. A row whose slug
 * already exists — given, or derived from title + author — is skipped, so
 * re-importing the same file never creates duplicates.
 */
export const importBatch = mutation({
  args: {
    token: v.string(),
    items: v.array(
      v.object({
        title: v.string(),
        slug: v.optional(v.string()),
        author: v.optional(v.string()),
        rating: v.optional(v.number()),
        review: v.optional(v.string()),
        finishedAt: v.number(),
        published: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, { token, items }) => {
    await requireAdmin(ctx, token);
    if (items.length > IMPORT_BATCH_LIMIT) {
      throw new Error(`At most ${IMPORT_BATCH_LIMIT} books per batch`);
    }
    const now = Date.now();
    const seen = new Set<string>();
    let inserted = 0;
    const skipped: { title: string; reason: string }[] = [];
    for (const { slug: given, published, ...fields } of items) {
      const slug = given?.trim() || slugify(fields.author ? `${fields.title} ${fields.author}` : fields.title);
      if (!slug) {
        skipped.push({ title: fields.title, reason: "empty title" });
        continue;
      }
      const exists =
        seen.has(slug) ||
        (await ctx.db
          .query("books")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique()) !== null;
      if (exists) {
        skipped.push({ title: fields.title, reason: `already exists (${slug})` });
        continue;
      }
      seen.add(slug);
      await ctx.db.insert("books", {
        ...fields,
        slug,
        published: published ?? true,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

const PUBLISH_BATCH = 500;

/**
 * Publish (or unpublish) every book at once — admin "Publish all" /
 * "Unpublish all". Starts a background job and returns immediately; the
 * job flips PUBLISH_BATCH rows per transaction, reschedules itself until
 * none are left, then rebuilds the public stats once.
 */
export const setAllPublished = mutation({
  args: { token: v.string(), published: v.boolean() },
  handler: async (ctx, { token, published }) => {
    await requireAdmin(ctx, token);
    await ctx.scheduler.runAfter(0, internal.books.setPublishedBatch, { published });
  },
});

export const setPublishedBatch = internalMutation({
  args: { published: v.boolean() },
  handler: async (ctx, { published }) => {
    // Rows still in the opposite state, a batch at a time.
    const rows = await ctx.db
      .query("books")
      .withIndex("by_published_finishedAt", (q) => q.eq("published", !published))
      .take(PUBLISH_BATCH);
    const now = Date.now();
    for (const row of rows) {
      await ctx.db.patch("books", row._id, { published, updatedAt: now });
    }
    if (rows.length === PUBLISH_BATCH) {
      await ctx.scheduler.runAfter(0, internal.books.setPublishedBatch, { published });
    } else {
      await ctx.scheduler.runAfter(0, internal.stats.recompute, { kind: "books" });
    }
  },
});

/**
 * Admin list, paginated — the full table can be thousands of rows, so the
 * admin never loads it at once. Light rows (no image URLs, no review);
 * optional title search and draft/published filter. Newest first.
 */
export const pageAdmin = query({
  args: {
    token: v.string(),
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(v.literal("all"), v.literal("published"), v.literal("draft"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { token, paginationOpts, status = "all", search }) => {
    await requireAdmin(ctx, token);
    const term = search?.trim();
    const result = term
      ? await ctx.db
          .query("books")
          .withSearchIndex("search_title", (q) => {
            const base = q.search("title", term);
            return status === "all" ? base : base.eq("published", status === "published");
          })
          .paginate(paginationOpts)
      : status === "all"
        ? await ctx.db.query("books").order("desc").paginate(paginationOpts)
        : await ctx.db
            .query("books")
            .withIndex("by_published_finishedAt", (q) => q.eq("published", status === "published"))
            .order("desc")
            .paginate(paginationOpts);
    return {
      ...result,
      page: result.page.map((d) => ({
        _id: d._id,
        title: d.title,
        author: d.author ?? null,
        finishedAt: d.finishedAt,
        published: d.published,
      })),
    };
  },
});

/** One full book for the admin edit form. */
export const getAdmin = query({
  args: { token: v.string(), id: v.id("books") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const d = await ctx.db.get("books", id);
    if (!d) return null;
    return { ...d, coverUrl: d.coverStorageId ? await ctx.storage.getUrl(d.coverStorageId) : null };
  },
});
