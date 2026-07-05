import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"projects">,
) {
  const existing = await ctx.db
    .query("projects")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== ignoreId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

async function withImageUrls(ctx: QueryCtx, project: Doc<"projects">) {
  const imageUrls = project.imageStorageIds
    ? await Promise.all(
        project.imageStorageIds.map((id) => ctx.storage.getUrl(id)),
      )
    : [];
  return { ...project, imageUrls };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("projects").collect();
    const published = rows
      .filter((r) => r.published)
      .sort((a, b) => a.order - b.order);
    return Promise.all(published.map((p) => withImageUrls(ctx, p)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!project || !project.published) return null;
    return withImageUrls(ctx, project);
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("projects").collect();
    const sorted = rows.sort((a, b) => a.order - b.order);
    return Promise.all(sorted.map((p) => withImageUrls(ctx, p)));
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    url: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("projects", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("projects"),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    url: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Project not found");
    const removedImageIds = (existing.imageStorageIds ?? []).filter(
      (sid) => !(fields.imageStorageIds ?? []).includes(sid),
    );
    for (const sid of removedImageIds) await ctx.storage.delete(sid);
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("projects"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) return;
    for (const sid of existing.imageStorageIds ?? []) {
      await ctx.storage.delete(sid);
    }
    await ctx.db.delete(id);
  },
});
