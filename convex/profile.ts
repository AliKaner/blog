import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/requireAdmin";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profile").first();
  },
});

export const upsert = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    bio: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    letterboxdUrl: v.optional(v.string()),
    tiktokUrl: v.optional(v.string()),
    mediumUrl: v.optional(v.string()),
  },
  handler: async (ctx, { token, ...fields }) => {
    await requireAdmin(ctx, token);
    const existing = await ctx.db.query("profile").first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...fields, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("profile", { ...fields, updatedAt: Date.now() });
    }
  },
});
