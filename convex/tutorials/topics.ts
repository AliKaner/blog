import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { requireAdmin } from "../lib/requireAdmin";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"tutorialTopics">,
) {
  const existing = await ctx.db
    .query("tutorialTopics")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== ignoreId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

async function publishedArticleCount(
  ctx: QueryCtx,
  topic: Doc<"tutorialTopics">,
) {
  const rows = await ctx.db
    .query("tutorialArticles")
    .withIndex("by_topic_order", (q) => q.eq("topicId", topic._id))
    .collect();
  return rows.filter((a) => a.published).length;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("tutorialTopics").collect();
    const published = rows
      .filter((t) => t.published)
      .sort((a, b) => a.order - b.order);
    return Promise.all(
      published.map(async (t) => ({
        ...t,
        articleCount: await publishedArticleCount(ctx, t),
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const topic = await ctx.db
      .query("tutorialTopics")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!topic || !topic.published) return null;
    return topic;
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("tutorialTopics").collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("tutorialTopics", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("tutorialTopics"),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Topic not found");
    // Spell out `description` so clearing it in the form (arg omitted →
    // undefined) removes it from the doc instead of keeping the old value.
    await ctx.db.patch(id, {
      ...fields,
      description: fields.description,
      updatedAt: Date.now(),
    });
  },
});

export const togglePublish = mutation({
  args: {
    token: v.string(),
    id: v.id("tutorialTopics"),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("tutorialTopics") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const articles = await ctx.db
      .query("tutorialArticles")
      .withIndex("by_topic_order", (q) => q.eq("topicId", id))
      .collect();
    for (const a of articles) {
      if (a.coverStorageId) await ctx.storage.delete(a.coverStorageId);
      if (a.videoStorageId) await ctx.storage.delete(a.videoStorageId);
      await ctx.db.delete(a._id);
    }
    await ctx.db.delete(id);
  },
});
