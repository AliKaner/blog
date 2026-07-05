import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/requireAdmin";

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const deleteFile = mutation({
  args: { token: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { token, storageId }) => {
    await requireAdmin(ctx, token);
    await ctx.storage.delete(storageId);
  },
});
