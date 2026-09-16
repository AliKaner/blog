import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { requireAdmin } from "../lib/requireAdmin";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"tutorialArticles">,
) {
  const existing = await ctx.db
    .query("tutorialArticles")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== ignoreId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

async function withUrls(ctx: QueryCtx, article: Doc<"tutorialArticles">) {
  const [coverUrl, videoFileUrl] = await Promise.all([
    article.coverStorageId ? ctx.storage.getUrl(article.coverStorageId) : null,
    article.videoStorageId ? ctx.storage.getUrl(article.videoStorageId) : null,
  ]);
  return { ...article, coverUrl, videoFileUrl };
}

export const listByTopic = query({
  args: { topicSlug: v.string() },
  handler: async (ctx, { topicSlug }) => {
    const topic = await ctx.db
      .query("tutorialTopics")
      .withIndex("by_slug", (q) => q.eq("slug", topicSlug))
      .unique();
    if (!topic || !topic.published) return null;
    const rows = await ctx.db
      .query("tutorialArticles")
      .withIndex("by_topic_order", (q) => q.eq("topicId", topic._id))
      .collect();
    const published = rows
      .filter((a) => a.published)
      .sort((a, b) => a.order - b.order);
    const articles = await Promise.all(published.map((a) => withUrls(ctx, a)));
    return { topic, articles };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const article = await ctx.db
      .query("tutorialArticles")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!article || !article.published) return null;
    const topic = await ctx.db.get(article.topicId);
    if (!topic || !topic.published) return null;
    const withArticleUrls = await withUrls(ctx, article);
    return { ...withArticleUrls, topic };
  },
});

export const listAllAdminByTopic = query({
  args: { token: v.string(), topicId: v.id("tutorialTopics") },
  handler: async (ctx, { token, topicId }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db
      .query("tutorialArticles")
      .withIndex("by_topic_order", (q) => q.eq("topicId", topicId))
      .collect();
    const sorted = rows.sort((a, b) => a.order - b.order);
    return Promise.all(sorted.map((a) => withUrls(ctx, a)));
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    topicId: v.id("tutorialTopics"),
    title: v.string(),
    slug: v.string(),
    body: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.id("_storage")),
    coverStorageId: v.optional(v.id("_storage")),
    order: v.number(),
    publishedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("tutorialArticles", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("tutorialArticles"),
    topicId: v.id("tutorialTopics"),
    title: v.string(),
    slug: v.string(),
    body: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.id("_storage")),
    coverStorageId: v.optional(v.id("_storage")),
    order: v.number(),
    publishedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Article not found");
    if (
      existing.coverStorageId &&
      existing.coverStorageId !== fields.coverStorageId
    ) {
      await ctx.storage.delete(existing.coverStorageId);
    }
    if (
      existing.videoStorageId &&
      existing.videoStorageId !== fields.videoStorageId
    ) {
      await ctx.storage.delete(existing.videoStorageId);
    }
    // Spell out optional fields so clearing one in the form (arg omitted →
    // undefined) removes it from the doc instead of keeping the old value.
    await ctx.db.patch(id, {
      ...fields,
      body: fields.body,
      videoUrl: fields.videoUrl,
      videoStorageId: fields.videoStorageId,
      coverStorageId: fields.coverStorageId,
      updatedAt: Date.now(),
    });
  },
});

export const togglePublish = mutation({
  args: {
    token: v.string(),
    id: v.id("tutorialArticles"),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("tutorialArticles") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) return;
    if (existing.coverStorageId) await ctx.storage.delete(existing.coverStorageId);
    if (existing.videoStorageId) await ctx.storage.delete(existing.videoStorageId);
    await ctx.db.delete(id);
  },
});
