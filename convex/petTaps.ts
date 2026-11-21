import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const petId = v.union(v.id("pets"), v.id("customPets"));

/** Records one click on a pet in the cabinet. */
export const tap = mutation({
  args: { petId },
  handler: async (ctx, { petId }) => {
    const pet = await ctx.db.get(petId);
    if (!pet) throw new ConvexError("Pet not found");

    const row = await ctx.db
      .query("petTaps")
      .withIndex("by_petId", (q) => q.eq("petId", petId))
      .unique();
    if (row) {
      await ctx.db.patch("petTaps", row._id, { count: row.count + 1 });
      return row.count + 1;
    }
    await ctx.db.insert("petTaps", { petId, count: 1 });
    return 1;
  },
});

/** Click counts for the given pets, keyed by pet id (missing → 0). */
export const counts = query({
  args: { petIds: v.array(petId) },
  handler: async (ctx, { petIds }) => {
    const result: Record<string, number> = {};
    for (const id of petIds.slice(0, 200)) {
      const row = await ctx.db
        .query("petTaps")
        .withIndex("by_petId", (q) => q.eq("petId", id))
        .unique();
      result[id] = row?.count ?? 0;
    }
    return result;
  },
});
