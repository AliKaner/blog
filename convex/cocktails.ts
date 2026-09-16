import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

async function assertSlugFree(
  ctx: MutationCtx,
  slug: string,
  ignoreId?: Id<"cocktails">,
) {
  const existing = await ctx.db
    .query("cocktails")
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
      .query("cocktails")
      .withIndex("by_published_triedAt", (q) => q.eq("published", true))
      .order("desc")
      .collect();
    return Promise.all(
      rows.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
          : null,
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const cocktail = await ctx.db
      .query("cocktails")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!cocktail || !cocktail.published) return null;
    return {
      ...cocktail,
      imageUrl: cocktail.imageStorageId
        ? await ctx.storage.getUrl(cocktail.imageStorageId)
        : null,
    };
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("cocktails").order("desc").collect();
    return Promise.all(
      rows.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
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
    baseSpirit: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    triedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("cocktails", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("cocktails"),
    title: v.string(),
    slug: v.string(),
    baseSpirit: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    triedAt: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await assertSlugFree(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Cocktail not found");
    if (
      existing.imageStorageId &&
      existing.imageStorageId !== fields.imageStorageId
    ) {
      await ctx.storage.delete(existing.imageStorageId);
    }
    // Spell out optional fields so clearing one in the form (arg omitted →
    // undefined) removes it from the doc instead of keeping the old value.
    await ctx.db.patch(id, {
      ...fields,
      baseSpirit: fields.baseSpirit,
      ingredients: fields.ingredients,
      rating: fields.rating,
      review: fields.review,
      imageStorageId: fields.imageStorageId,
      updatedAt: Date.now(),
    });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("cocktails"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("cocktails") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) return;
    if (existing.imageStorageId) {
      await ctx.storage.delete(existing.imageStorageId);
    }
    await ctx.db.delete(id);
  },
});
