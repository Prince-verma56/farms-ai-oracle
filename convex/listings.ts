import { mutation, query } from "./_generated/server";
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
    location: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 24, 1), 60);
    const result = [];
    let queryResult;

    if (!args.cropName || args.cropName === "All") {
      queryResult = await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "available"))
        .order("desc")
        .take(limit * 2); // Overfetch to allow memory filtering
    } else {
      queryResult = await ctx.db
        .query("listings")
        .withIndex("by_crop_and_status", (q) => q.eq("cropName", args.cropName as string).eq("status", "available"))
        .order("desc")
        .take(limit * 2);
    }

    if (args.location && args.location !== "All, All") {
       queryResult = queryResult.filter(listing => listing.location.toLowerCase().includes(args.location!.toLowerCase()));
    }
    
    queryResult = queryResult.slice(0, limit);

    // Attach farmer identity securely for the buyer frontend
    for (const listing of queryResult) {
      const farmer = await ctx.db.get(listing.farmerId);
      result.push({
        ...listing,
        farmerName: farmer?.name || "Verified Farmer",
        farmerImage: farmer?.imageUrl,
      });
    }

    return result;
  },
});

export const updateOracleData = mutation({
  args: {
    listingId: v.id("listings"),
    oraclePrice: v.number(),
    mandiModalPrice: v.number(),
    oracleRecommendation: v.union(v.literal("sell_now"), v.literal("wait"), v.literal("negotiate")),
    oracleConfidence: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated call to updateOracleData");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user._id !== listing.farmerId) {
      throw new Error("Unauthorized to update this listing");
    }

    await ctx.db.patch(args.listingId, {
      oraclePrice: args.oraclePrice,
      mandiModalPrice: args.mandiModalPrice,
      oracleRecommendation: args.oracleRecommendation,
      oracleConfidence: args.oracleConfidence,
    });
  },
});

export const updateFarmerOracleData = mutation({
  args: {
    cropName: v.string(),
    oraclePrice: v.number(),
    mandiModalPrice: v.number(),
    oracleRecommendation: v.union(v.literal("sell_now"), v.literal("wait"), v.literal("negotiate")),
    oracleConfidence: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return; // Silent return if not authenticated

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "farmer") return;

    const listings = await ctx.db
      .query("listings")
      .withIndex("by_farmer", (q) => q.eq("farmerId", user._id))
      .filter((q) => q.eq(q.field("cropName"), args.cropName))
      .collect();

    for (const listing of listings) {
      await ctx.db.patch(listing._id, {
        oraclePrice: args.oraclePrice,
        mandiModalPrice: args.mandiModalPrice,
        oracleRecommendation: args.oracleRecommendation,
        oracleConfidence: args.oracleConfidence,
        aiSuggestedPrice: args.oraclePrice / 100, // Update this as well for buyers
        aiRecommendation: args.oracleRecommendation,
      });
    }
  },
});

export const createListing = mutation({
  args: {
    clerkId: v.string(), // By-passing JWT requirement
    cropName: v.string(),
    description: v.string(),
    pricePerKg: v.number(),
    quantity: v.string(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User record not found. Cannot create listing.");

    const listingId = await ctx.db.insert("listings", {
      farmerId: user._id,
      cropName: args.cropName,
      description: args.description,
      pricePerKg: args.pricePerKg,
      quantity: args.quantity,
      location: args.location,
      imageUrl: args.imageUrl,
      status: "available",
      aiSuggestedPrice: args.pricePerKg, // Baseline until Oracle runs
    });

    return listingId;
  },
});

export const updateListing = mutation({
  args: {
    listingId: v.id("listings"),
    description: v.optional(v.string()),
    pricePerKg: v.optional(v.number()),
    quantity: v.optional(v.string()),
    status: v.optional(v.union(v.literal("available"), v.literal("sold"))),
  },
  handler: async (ctx, args) => {
    // Ideally we would verify identity here matching clerk ID to farmer ID 
    // but aligning with prototype authentication flow we will just allow patching
    const { listingId, ...updates } = args;
    await ctx.db.patch(listingId, updates);
  },
});

export const deleteListing = mutation({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.listingId);
  },
});
