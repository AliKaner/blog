import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

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
