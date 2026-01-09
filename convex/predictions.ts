import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all predictions
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("predictions").collect();
  },
});

/**
 * Get predictions for a specific zone
 */
export const getByZone = query({
  args: {
    zoneId: v.id("floodZones"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("predictions")
      .withIndex("by_zone", (q) => q.eq("zoneId", args.zoneId))
      .collect();
  },
});

/**
 * Get latest predictions for a zone by time horizon
 */
export const getLatestByZone = query({
  args: {
    zoneId: v.id("floodZones"),
  },
  handler: async (ctx, args) => {
    const allPredictions = await ctx.db
      .query("predictions")
      .withIndex("by_zone", (q) => q.eq("zoneId", args.zoneId))
      .collect();

    // Group by time horizon and get the most recent for each
    const latest: Record<string, typeof allPredictions[0]> = {};
    const now = Date.now();

    for (const pred of allPredictions) {
      // Only include valid predictions
      if (pred.validUntil < now) continue;

      const existing = latest[pred.timeHorizon];
      if (!existing || pred.predictedAt > existing.predictedAt) {
        latest[pred.timeHorizon] = pred;
      }
    }

    return Object.values(latest);
  },
});

/**
 * Get predictions by time horizon
 */
export const getByHorizon = query({
  args: {
    timeHorizon: v.union(
      v.literal("1h"),
      v.literal("2h"),
      v.literal("4h"),
      v.literal("8h")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("predictions")
      .withIndex("by_horizon", (q) => q.eq("timeHorizon", args.timeHorizon))
      .collect();
  },
});

/**
 * Get valid (non-expired) predictions
 */
export const getValid = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allPredictions = await ctx.db.query("predictions").collect();
    return allPredictions.filter((p) => p.validUntil >= now);
  },
});

/**
 * Upsert a prediction (create or update if exists)
 */
export const upsert = mutation({
  args: {
    zoneId: v.id("floodZones"),
    timeHorizon: v.union(
      v.literal("1h"),
      v.literal("2h"),
      v.literal("4h"),
      v.literal("8h")
    ),
    floodProbability: v.number(),
    predictedWaterLevel: v.optional(v.number()),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    predictedAt: v.number(),
    validUntil: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if prediction already exists for this zone + horizon
    const existing = await ctx.db
      .query("predictions")
      .withIndex("by_zone", (q) => q.eq("zoneId", args.zoneId))
      .filter((q) => q.eq(q.field("timeHorizon"), args.timeHorizon))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        floodProbability: args.floodProbability,
        predictedWaterLevel: args.predictedWaterLevel,
        severity: args.severity,
        predictedAt: args.predictedAt,
        validUntil: args.validUntil,
        metadata: args.metadata,
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("predictions", {
        zoneId: args.zoneId,
        timeHorizon: args.timeHorizon,
        floodProbability: args.floodProbability,
        predictedWaterLevel: args.predictedWaterLevel,
        severity: args.severity,
        predictedAt: args.predictedAt,
        validUntil: args.validUntil,
        metadata: args.metadata,
      });
    }
  },
});

/**
 * Delete expired predictions
 */
export const deleteExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("predictions")
      .withIndex("by_validUntil")
      .filter((q) => q.lt(q.field("validUntil"), now))
      .collect();

    let deleted = 0;
    for (const pred of expired) {
      await ctx.db.delete(pred._id);
      deleted++;
    }

    return { deleted };
  },
});
