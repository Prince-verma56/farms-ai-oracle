import { query } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByFarmer = query({
  args: { farmerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("listings")
      .withIndex("by_farmer", (q) => q.eq("farmerId", args.farmerId))
      .collect();
  },
});

export const listAvailable = query({
  args: {
    cropName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 24, 1), 60);
    if (!args.cropName?.trim()) {
      return await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "available"))
        .take(limit);
    }

    return await ctx.db
      .query("listings")
      .withIndex("by_crop_and_status", (q) => q.eq("cropName", args.cropName as string).eq("status", "available"))
      .take(limit);
  },
});
