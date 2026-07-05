import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  SESSION_TTL_MS,
  randomToken,
  timingSafeEqual,
} from "./lib/requireAdmin";

export const login = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || !timingSafeEqual(password, expected)) {
      throw new Error("Invalid password");
    }
    const token = randomToken();
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;
    await ctx.db.insert("adminSessions", { token, createdAt: now, expiresAt });
    return { token, expiresAt };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const checkSession = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token) return { valid: false as const };
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!session || session.expiresAt < Date.now()) {
      return { valid: false as const };
    }
    return { valid: true as const, expiresAt: session.expiresAt };
  },
});
