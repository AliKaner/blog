import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  FEED_COOLDOWN_MS,
  FEED_HAPPINESS_BOOST,
  FEED_HUNGER_BOOST,
  computeEffective,
} from "../src/lib/petDecay";

export const listPets = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pets = await ctx.db.query("pets").collect();
    return pets.map((p) => ({
      _id: p._id,
      kind: p.kind,
      name: p.name,
      ...computeEffective(p, now),
      totalFeeds: p.totalFeeds,
      canFeedAt: p.lastFedAt + FEED_COOLDOWN_MS,
    }));
  },
});

export const feedPet = mutation({
  args: { petId: v.id("pets") },
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
    await ctx.db.patch(petId, {
      hunger,
      happiness,
      lastFedAt: now,
      totalFeeds,
    });
    return { hunger, happiness, totalFeeds };
  },
});

export const seedPets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("pets").collect();
    if (existing.length > 0) return;
    const now = Date.now();
    const seed = [
      { kind: "cat" as const, name: "Whiskers" },
      { kind: "dog" as const, name: "Biscuit" },
      { kind: "bird" as const, name: "Sunny" },
    ];
    for (const pet of seed) {
      await ctx.db.insert("pets", {
        ...pet,
        hunger: 100,
        happiness: 100,
        lastFedAt: now,
        totalFeeds: 0,
      });
    }
  },
});
