import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const createOrder = mutation({
  args: {
    clerkId: v.string(), // Extracted bypass
    listingId: v.id("listings"),
    totalAmount: v.number(),
    paymentId: v.string(), // Razorpay payment ID
    razorpayOrderId: v.string(), // Razorpay order ID
    quantity: v.string(), // e.g., "100 quintal" or numeric
    deliveryAddress: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
    })),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!buyer) throw new Error("Buyer not found");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");

    // Reduce stock slightly simply
    const oldStockStr = String(listing.quantity || "0").replace(/[^\d.]/g, "");
    const purStockStr = String(args.quantity || "0").replace(/[^\d.]/g, "");
    
    let oldStockNum = Number.parseFloat(oldStockStr);
    let purStockNum = Number.parseFloat(purStockStr);
    
    if (!Number.isNaN(oldStockNum) && !Number.isNaN(purStockNum)) {
       let newStock = oldStockNum - purStockNum;
       if (newStock < 0) newStock = 0;
       
       let newStatus = listing.status;
       if (newStock <= 0) {
           newStatus = "sold";
       }
       
       // Note: Keeping unit (e.g. quintal, kg) intact if we can, but fallback string approach for now
       await ctx.db.patch(listing._id, {
           quantity: String(newStock) + " " + (listing.quantity.replace(/[\d.\s]/g, "")).trim(),
           status: newStatus
       });
    }

    return await ctx.db.insert("orders", {
      listingId: listing._id,
      buyerId: buyer._id,
      farmerId: listing.farmerId,
      totalAmount: args.totalAmount,
      paymentStatus: "paid",
      paymentId: args.paymentId,
      razorpayOrderId: args.razorpayOrderId,
      orderStatus: "placed",
      deliveryAddress: args.deliveryAddress,
      latitude: args.latitude,
      longitude: args.longitude,
    });
  },
});

export const getBuyerOrders = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const buyer = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!buyer) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .collect();

    // Map the listings and farmer details
    const results = [];
    for (const order of orders) {
      const listing = await ctx.db.get(order.listingId);
      const farmer = await ctx.db.get(order.farmerId);
      results.push({ 
        ...order, 
        cropName: listing?.cropName || "Direct Farm Purchase",
        farmerName: farmer?.name || "Verified Farmer",
        farmerEmail: farmer?.email || "contact@farmdirect.com",
        farmerPhone: farmer?.phone || "Phone Hidden",
        farmerImage: farmer?.imageUrl,
      });
    }
    return results;
  },
});

export const getFarmerOrders = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const farmer = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!farmer) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_farmer", (q) => q.eq("farmerId", farmer._id))
      .collect();
      
    // Map the listings and buyer details
    const results = [];
    for (const order of orders) {
      const listing = await ctx.db.get(order.listingId);
      const buyer = await ctx.db.get(order.buyerId);
      results.push({ 
        ...order, 
        cropName: listing?.cropName || "Direct Farm Purchase",
        buyerName: buyer?.name || "Anonymous Buyer",
        buyerEmail: buyer?.email || "-",
        buyerPhone: buyer?.phone || "No Contact",
        buyerImage: buyer?.imageUrl,
      });
    }
    return results;
  },
});

export const getOrderDetails = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    // Attempt to treat as a direct ID but handle random search strings gracefully
    try {
      const orderId = args.orderId as Id<"orders">;
      const order = await ctx.db.get(orderId);
      if (!order) return null;

      const listing = await ctx.db.get(order.listingId);
      const farmer = await ctx.db.get(order.farmerId);
      const buyer = await ctx.db.get(order.buyerId);

      return {
        ...order,
        cropName: listing?.cropName || "Direct Farm Purchase",
        quantity: listing?.quantity || "Various",
        location: listing?.location || "Unknown",
        farmerName: farmer?.name || "Verified Farmer",
        farmerEmail: farmer?.email || "contact@farmdirect.com",
        buyerName: buyer?.name || "Buyer",
        buyerEmail: buyer?.email || "-",
      };
    } catch (e) {
      return null;
    }
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    orderStatus: v.union(v.literal("placed"), v.literal("shipped"), v.literal("delivered"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { orderStatus: args.orderStatus });
  },
});

export const deleteOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orderId);
  },
});

export const clearOrderHistory = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .collect();

    for (const order of orders) {
      await ctx.db.delete(order._id);
    }
  },
});
