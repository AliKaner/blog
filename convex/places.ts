import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"places">,
) {
  const existing = await ctx.db
    .query("places")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== ignoreId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

async function withPhotoUrls(ctx: QueryCtx, place: Doc<"places">) {
  const photoUrls = place.photoStorageIds
    ? await Promise.all(
        place.photoStorageIds.map((id) => ctx.storage.getUrl(id)),
      )
    : [];
  return { ...place, photoUrls };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("places")
      .withIndex("by_published_visitedAt", (q) => q.eq("published", true))
      .order("desc")
      .collect();
    return Promise.all(rows.map((p) => withPhotoUrls(ctx, p)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const place = await ctx.db
      .query("places")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!place || !place.published) return null;
    return withPhotoUrls(ctx, place);
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("places").order("desc").collect();
    return Promise.all(rows.map((p) => withPhotoUrls(ctx, p)));
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    slug: v.string(),
    country: v.optional(v.string()),
    description: v.optional(v.string()),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    visitedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("places", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("places"),
    name: v.string(),
    slug: v.string(),
    country: v.optional(v.string()),
    description: v.optional(v.string()),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    visitedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Place not found");
    const removedPhotoIds = (existing.photoStorageIds ?? []).filter(
      (sid) => !(fields.photoStorageIds ?? []).includes(sid),
    );
    for (const sid of removedPhotoIds) await ctx.storage.delete(sid);
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("places"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("places") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) return;
    for (const sid of existing.photoStorageIds ?? []) {
      await ctx.storage.delete(sid);
    }
    await ctx.db.delete(id);
  },
});
