import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/requireAdmin";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("resumeItems").collect();
    const publishedRows = rows.filter((r) => r.published).sort((a, b) => a.order - b.order);
    return await Promise.all(
      publishedRows.map(async (row) => ({
        ...row,
        logoUrl: row.logoStorageId ? await ctx.storage.getUrl(row.logoStorageId) : null,
      }))
    );
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("resumeItems").collect();
    const sortedRows = rows.sort((a, b) => a.order - b.order);
    return await Promise.all(
      sortedRows.map(async (row) => ({
        ...row,
        logoUrl: row.logoStorageId ? await ctx.storage.getUrl(row.logoStorageId) : null,
      }))
    );
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    kind: v.union(v.literal("experience"), v.literal("education")),
    title: v.string(),
    organization: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
    url: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    stack: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    const now = Date.now();
    return await ctx.db.insert("resumeItems", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("resumeItems"),
    kind: v.union(v.literal("experience"), v.literal("education")),
    title: v.string(),
    organization: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
    url: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    stack: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("resumeItems"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("resumeItems") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(id);
  },
});
