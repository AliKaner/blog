import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"movies">,
) {
  const existing = await ctx.db
    .query("movies")
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
      .query("movies")
      .withIndex("by_published_watchedAt", (q) => q.eq("published", true))
      .order("desc")
      .collect();
    return Promise.all(
      rows.map(async (m) => ({
        ...m,
        posterUrl: m.posterStorageId
          ? await ctx.storage.getUrl(m.posterStorageId)
          : null,
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const movie = await ctx.db
      .query("movies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!movie || !movie.published) return null;
    return {
      ...movie,
      posterUrl: movie.posterStorageId
        ? await ctx.storage.getUrl(movie.posterStorageId)
        : null,
    };
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("movies").order("desc").collect();
    return Promise.all(
      rows.map(async (m) => ({
        ...m,
        posterUrl: m.posterStorageId
          ? await ctx.storage.getUrl(m.posterStorageId)
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
    year: v.optional(v.number()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    posterStorageId: v.optional(v.id("_storage")),
    watchedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("movies", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("movies"),
    title: v.string(),
    slug: v.string(),
    year: v.optional(v.number()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    posterStorageId: v.optional(v.id("_storage")),
    watchedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Movie not found");
    if (
      existing.posterStorageId &&
      existing.posterStorageId !== fields.posterStorageId
    ) {
      await ctx.storage.delete(existing.posterStorageId);
    }
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("movies"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("movies") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) return;
    if (existing.posterStorageId) {
      await ctx.storage.delete(existing.posterStorageId);
    }
    await ctx.db.delete(id);
  },
});
