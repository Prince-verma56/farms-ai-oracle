import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
  args: { role: v.union(v.literal("farmer"), v.literal("buyer")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Called storeUser without authentication");

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user !== null) {
      return user._id; // User pehle se hai
    }

    // Naya user create karo
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "unknown",
      clerkId: identity.subject,
      role: args.role,
      hasOnboarded: false,
      imageUrl: identity.pictureUrl,
    });
  },
});

export const getRoleByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    return {
      exists: Boolean(user),
      role: user?.role ?? null,
      id: user?._id ?? null,
    };
  },
});

export const upsertRoleByClerkId = mutation({
  args: {
    clerkId: v.string(),
    role: v.union(v.literal("farmer"), v.literal("buyer")),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      role: args.role,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      hasOnboarded: true,
    });
  },
});
