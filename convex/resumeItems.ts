import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

const subProjectValidator = v.object({
  name: v.string(),
  url: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
});

async function withResolvedUrls(ctx: QueryCtx, row: Doc<"resumeItems">) {
  const projects = row.projects
    ? await Promise.all(
        row.projects.map(async (p) => ({
          ...p,
          imageUrl: p.imageStorageId
            ? await ctx.storage.getUrl(p.imageStorageId)
            : null,
        })),
      )
    : [];
  return {
    ...row,
    logoUrl: row.logoStorageId ? await ctx.storage.getUrl(row.logoStorageId) : null,
    projects,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("resumeItems").collect();
    const publishedRows = rows.filter((r) => r.published).sort((a, b) => a.order - b.order);
    return await Promise.all(publishedRows.map((row) => withResolvedUrls(ctx, row)));
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("resumeItems").collect();
    const sortedRows = rows.sort((a, b) => a.order - b.order);
    return await Promise.all(sortedRows.map((row) => withResolvedUrls(ctx, row)));
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
    projects: v.optional(v.array(subProjectValidator)),
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
    projects: v.optional(v.array(subProjectValidator)),
  },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Resume item not found");

    if (existing.logoStorageId && existing.logoStorageId !== fields.logoStorageId) {
      await ctx.storage.delete(existing.logoStorageId);
    }
    const keptImageIds = new Set(
      (fields.projects ?? [])
        .map((p) => p.imageStorageId)
        .filter((id): id is Id<"_storage"> => !!id),
    );
    for (const p of existing.projects ?? []) {
      if (p.imageStorageId && !keptImageIds.has(p.imageStorageId)) {
        await ctx.storage.delete(p.imageStorageId);
      }
    }

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
    const existing = await ctx.db.get(id);
    if (!existing) return;
    if (existing.logoStorageId) await ctx.storage.delete(existing.logoStorageId);
    for (const p of existing.projects ?? []) {
      if (p.imageStorageId) await ctx.storage.delete(p.imageStorageId);
    }
    await ctx.db.delete(id);
  },
});
