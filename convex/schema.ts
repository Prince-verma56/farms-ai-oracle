import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --- CORE SYSTEM: USERS ---
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(), 
    // role is optional initially so we can redirect to onboarding
    role: v.optional(v.union(v.literal("farmer"), v.literal("buyer"))),
    hasOnboarded: v.boolean(),
    imageUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  // --- PRODUCT MODULE: LISTINGS (The Farmer's Crop) ---
  listings: defineTable({
    farmerId: v.id("users"),
    cropName: v.string(),
    description: v.string(),
    pricePerKg: v.number(),
    quantity: v.string(),
    // AI Insights (The 'Wow' Factor)
    aiSuggestedPrice: v.number(),
    aiRecommendation: v.optional(v.string()), // "Sell now" or "Wait"
    oraclePrice: v.optional(v.number()),
    mandiModalPrice: v.optional(v.number()),
    oracleConfidence: v.optional(v.number()),
    oracleRecommendation: v.optional(v.union(v.literal("sell_now"), v.literal("wait"), v.literal("negotiate"))),
    status: v.union(v.literal("available"), v.literal("sold")),
    location: v.string(),
    imageUrl: v.optional(v.string()),
  })
  .index("by_status", ["status"])
  .index("by_farmer", ["farmerId"])
  .index("by_crop", ["cropName"])
  .index("by_crop_and_status", ["cropName", "status"]),

  // --- PRODUCT MODULE: ORDERS (The Transactions) ---
  orders: defineTable({
    listingId: v.id("listings"),
    buyerId: v.id("users"),
    farmerId: v.id("users"),
    totalAmount: v.number(),
    // Payment Integration Fields
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    paymentId: v.optional(v.string()), // For Razorpay Payment ID (rzp_pay_xxx)
    razorpayOrderId: v.optional(v.string()), // For Razorpay Order ID (order_xxx)
    orderStatus: v.union(
      v.literal("placed"), 
      v.literal("shipped"), 
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    deliveryAddress: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
    })),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  })
  .index("by_buyer", ["buyerId"])
  .index("by_farmer", ["farmerId"]),

  // --- MARKET INTELLIGENCE MODULE ---
  marketSnapshots: defineTable({
    queryKey: v.string(),
    commodity: v.string(),
    state: v.string(),
    market: v.string(),
    date: v.string(),
    minPrice: v.number(),
    maxPrice: v.number(),
    modalPrice: v.number(),
    isHistorical: v.boolean(),
    anchorDate: v.string(),
  })
    .index("by_queryKey_and_date", ["queryKey", "date"])
    .index("by_anchorDate_and_queryKey", ["anchorDate", "queryKey"]),

  oracleRuns: defineTable({
    queryKey: v.string(),
    commodity: v.string(),
    state: v.string(),
    city: v.string(),
    quantity: v.number(),
    unit: v.string(),
    mandiDate: v.optional(v.string()),
    fairPrice: v.number(),
    buyerPricePerKg: v.number(),
    confidence: v.number(),
    recommendation: v.union(v.literal("sell_now"), v.literal("wait"), v.literal("negotiate")),
    reasoning: v.string(),
    forecast14: v.array(v.number()),
    anchorDate: v.string(),
  })
    .index("by_queryKey_and_anchorDate", ["queryKey", "anchorDate"])
    .index("by_anchorDate_and_queryKey", ["anchorDate", "queryKey"]),
});
