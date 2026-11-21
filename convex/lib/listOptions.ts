import { v } from "convex/values";

/** Shared args for the public Movies / Books list queries. */
export const listOptions = {
  sort: v.optional(
    v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("rating-desc"),
      v.literal("rating-asc"),
    ),
  ),
  /** Show only this rating (the whole-number band, so 8 matches 8–8.9). */
  rating: v.optional(v.number()),
  /** Full-text search on the title; results come by relevance. */
  search: v.optional(v.string()),
};

export type ListSort = "newest" | "oldest" | "rating-desc" | "rating-asc";
