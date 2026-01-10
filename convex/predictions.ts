import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Calculate severity from flood height (in cm)
 * - Low: < 20cm
 * - Medium: 20-50cm
 * - High: 50-100cm
 * - Critical: ≥ 100cm
 */
export function getSeverityFromHeight(
  height: number
): "low" | "medium" | "high" | "critical" {
  if (height < 20) return "low";
  if (height < 50) return "medium";
  if (height < 100) return "high";
  return "critical";
}

/**
 * Calculate passability from flood height (in cm)
 * - Vehicles impassable: ≥ 30cm
 * - Humans impassable: ≥ 50cm
 */
export function getPassability(height: number): {
  vehicles: boolean;
  humans: boolean;
} {
  return {
    vehicles: height < 30,
    humans: height < 50,
  };
}

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
 * Get predictions for a specific device
 */
export const getByDevice = query({
  args: {
    deviceId: v.id("iotDevices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("predictions")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .collect();
  },
});

/**
 * Get latest predictions for a device by time horizon
 */
export const getLatestByDevice = query({
  args: {
    deviceId: v.id("iotDevices"),
  },
  handler: async (ctx, args) => {
    const allPredictions = await ctx.db
      .query("predictions")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
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
    deviceId: v.id("iotDevices"),
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
    // Check if prediction already exists for this device + horizon
    const existing = await ctx.db
      .query("predictions")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
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
        deviceId: args.deviceId,
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
