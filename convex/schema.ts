import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  movies: defineTable({
    title: v.string(),
    slug: v.string(),
    year: v.optional(v.number()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    posterStorageId: v.optional(v.id("_storage")),
    watchedAt: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published_watchedAt", ["published", "watchedAt"])
    .index("by_slug", ["slug"]),

  places: defineTable({
    name: v.string(),
    slug: v.string(),
    country: v.optional(v.string()),
    description: v.optional(v.string()),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    visitedAt: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published_visitedAt", ["published", "visitedAt"])
    .index("by_slug", ["slug"]),

  books: defineTable({
    title: v.string(),
    slug: v.string(),
    author: v.optional(v.string()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    finishedAt: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published_finishedAt", ["published", "finishedAt"])
    .index("by_slug", ["slug"]),

  softwareLogs: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    tags: v.optional(v.array(v.string())),
    loggedAt: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published_loggedAt", ["published", "loggedAt"])
    .index("by_slug", ["slug"]),

  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    coverStorageId: v.optional(v.id("_storage")),
    publishedAt: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published_publishedAt", ["published", "publishedAt"])
    .index("by_slug", ["slug"]),

  adminSessions: defineTable({
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  pets: defineTable({
    kind: v.union(v.literal("cat"), v.literal("dog"), v.literal("bird")),
    name: v.string(),
    hunger: v.number(),
    happiness: v.number(),
    lastFedAt: v.number(),
    totalFeeds: v.number(),
  }).index("by_kind", ["kind"]),
});
