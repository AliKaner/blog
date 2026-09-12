import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

async function withImageUrl(ctx: QueryCtx, drawing: Doc<"drawings">) {
  const imageUrl = await ctx.storage.getUrl(drawing.imageStorageId);
  return { ...drawing, imageUrl };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("drawings").collect();
    const published = rows
      .filter((r) => r.published)
      .sort((a, b) => a.order - b.order);
    return Promise.all(published.map((d) => withImageUrl(ctx, d)));
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("drawings").collect();
    const sorted = rows.sort((a, b) => a.order - b.order);
    return Promise.all(sorted.map((d) => withImageUrl(ctx, d)));
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.optional(v.string()),
    imageStorageId: v.id("_storage"),
    order: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    const now = Date.now();
    return await ctx.db.insert("drawings", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("drawings"),
    title: v.optional(v.string()),
    imageStorageId: v.id("_storage"),
    order: v.number(),
    published: v.boolean(),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Drawing not found");
    if (existing.imageStorageId !== fields.imageStorageId) {
      await ctx.storage.delete(existing.imageStorageId);
    }
    // Spell out `title` so clearing it in the form (arg omitted →
    // undefined) removes it from the doc instead of keeping the old value.
    await ctx.db.patch(id, {
      ...fields,
      title: fields.title,
      updatedAt: Date.now(),
    });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("drawings"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("drawings") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) return;
    await ctx.storage.delete(existing.imageStorageId);
    await ctx.db.delete(id);
  },
});
