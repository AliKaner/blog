import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/requireAdmin";
import {
  FEED_COOLDOWN_MS,
  FEED_HAPPINESS_BOOST,
  FEED_HUNGER_BOOST,
  computeEffective,
} from "../src/lib/petDecay";
import { TOTAL_CELLS } from "../src/lib/customPetGrid";

const frameValidator = v.array(v.union(v.string(), v.null()));

function assertValidFrame(frame: (string | null)[], label: string) {
  if (frame.length !== TOTAL_CELLS) {
    throw new Error(`${label} must have exactly ${TOTAL_CELLS} cells`);
  }
}

export const submit = mutation({
  args: {
    name: v.string(),
    frame1: frameValidator,
    frame2: frameValidator,
  },
  handler: async (ctx, { name, frame1, frame2 }) => {
    const trimmedName = name.trim().slice(0, 24);
    if (!trimmedName) throw new Error("Give your pet a name");
    assertValidFrame(frame1, "frame1");
    assertValidFrame(frame2, "frame2");
    const now = Date.now();
    return await ctx.db.insert("customPets", {
      name: trimmedName,
      frame1,
      frame2,
      hunger: 100,
      happiness: 100,
      lastFedAt: now,
      totalFeeds: 0,
      published: false,
      createdAt: now,
    });
  },
});

export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("customPets")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    return rows.map((p) => ({
      _id: p._id,
      name: p.name,
      frame1: p.frame1,
      frame2: p.frame2,
      published: p.published,
      ...computeEffective(p, now),
      totalFeeds: p.totalFeeds,
      canFeedAt: p.lastFedAt + FEED_COOLDOWN_MS,
    }));
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("customPets")) },
  handler: async (ctx, { ids }) => {
    const now = Date.now();
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        frame1: p.frame1,
        frame2: p.frame2,
        published: p.published,
        ...computeEffective(p, now),
        totalFeeds: p.totalFeeds,
        canFeedAt: p.lastFedAt + FEED_COOLDOWN_MS,
      }));
  },
});

export const listAllAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("customPets").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const feedCustomPet = mutation({
  args: { petId: v.id("customPets") },
  handler: async (ctx, { petId }) => {
    const pet = await ctx.db.get(petId);
    if (!pet) throw new Error("Pet not found");
    const now = Date.now();
    if (now - pet.lastFedAt < FEED_COOLDOWN_MS) {
      throw new Error("This pet just ate — try again in a moment");
    }
    const effective = computeEffective(pet, now);
    const hunger = Math.min(100, effective.hunger + FEED_HUNGER_BOOST);
    const happiness = Math.min(
      100,
      effective.happiness + FEED_HAPPINESS_BOOST,
    );
    const totalFeeds = pet.totalFeeds + 1;
    await ctx.db.patch(petId, { hunger, happiness, lastFedAt: now, totalFeeds });
    return { hunger, happiness, totalFeeds };
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("customPets"),
    name: v.string(),
    frame1: frameValidator,
    frame2: frameValidator,
  },
  handler: async (ctx, { token, id, name, frame1, frame2 }) => {
    await requireAdmin(ctx, token);
    const trimmedName = name.trim().slice(0, 24);
    if (!trimmedName) throw new Error("Give this pet a name");
    assertValidFrame(frame1, "frame1");
    assertValidFrame(frame2, "frame2");
    await ctx.db.patch(id, { name: trimmedName, frame1, frame2 });
  },
});

export const togglePublish = mutation({
  args: { token: v.string(), id: v.id("customPets"), published: v.boolean() },
  handler: async (ctx, { token, id, published }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { published });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("customPets") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(id);
  },
});
