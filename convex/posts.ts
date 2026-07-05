import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"posts">,
) {
  const existing = await ctx.db
    .query("posts")
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
      .query("posts")
      .withIndex("by_published_publishedAt", (q) => q.eq("published", true))
      .order("desc")
      .collect();
    return Promise.all(
      rows.map(async (p) => ({
        ...p,
        coverUrl: p.coverStorageId
          ? await ctx.storage.getUrl(p.coverStorageId)
          : null,
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!post || !post.published) return null;
    return {
      ...post,
      coverUrl: post.coverStorageId
        ? await ctx.storage.getUrl(post.coverStorageId)
        : null,
    };
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("posts").order("desc").collect();
    return Promise.all(
      rows.map(async (p) => ({
        ...p,
        coverUrl: p.coverStorageId
          ? await ctx.storage.getUrl(p.coverStorageId)
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
    body: v.string(),
    coverStorageId: v.optional(v.id("_storage")),
    publishedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("posts", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    coverStorageId: v.optional(v.id("_storage")),
    publishedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Post not found");
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
  args: { token: v.string(), id: v.id("posts"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("posts") },
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
