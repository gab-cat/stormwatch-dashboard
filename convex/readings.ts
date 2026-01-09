import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all sensor readings
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sensorReadings").collect();
  },
});

/**
 * Get readings for a specific device
 */
export const getByDevice = query({
  args: {
    deviceId: v.id("iotDevices"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("sensorReadings")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId));

    if (args.limit) {
      return await query.order("desc").take(args.limit);
    }
    return await query.order("desc").collect();
  },
});

/**
 * Get recent readings by type
 */
export const getRecentByType = query({
  args: {
    readingType: v.union(
      v.literal("water_level"),
      v.literal("rainfall"),
      v.literal("flow_rate"),
      v.literal("temperature"),
      v.literal("humidity")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("sensorReadings")
      .withIndex("by_type", (q) => q.eq("readingType", args.readingType));

    if (args.limit) {
      return await query.order("desc").take(args.limit);
    }
    return await query.order("desc").collect();
  },
});

/**
 * Get readings within a time range
 */
export const getByTimeRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    deviceId: v.optional(v.id("iotDevices")),
  },
  handler: async (ctx, args) => {
    let allReadings;
    if (args.deviceId !== undefined) {
      allReadings = await ctx.db
        .query("sensorReadings")
        .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId!))
        .collect();
    } else {
      allReadings = await ctx.db
        .query("sensorReadings")
        .withIndex("by_timestamp")
        .collect();
    }

    return allReadings.filter(
      (reading) => reading.timestamp >= args.startTime && reading.timestamp <= args.endTime
    );
  },
});

/**
 * Create a new sensor reading
 */
export const create = mutation({
  args: {
    deviceId: v.id("iotDevices"),
    readingType: v.union(
      v.literal("water_level"),
      v.literal("rainfall"),
      v.literal("flow_rate"),
      v.literal("temperature"),
      v.literal("humidity")
    ),
    value: v.number(),
    unit: v.string(),
    timestamp: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sensorReadings", {
      deviceId: args.deviceId,
      readingType: args.readingType,
      value: args.value,
      unit: args.unit,
      timestamp: args.timestamp || Date.now(),
      metadata: args.metadata,
    });
  },
});

/**
 * Delete old readings (for data cleanup)
 */
export const deleteOld = mutation({
  args: {
    olderThan: v.number(), // Timestamp threshold
  },
  handler: async (ctx, args) => {
    const oldReadings = await ctx.db
      .query("sensorReadings")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), args.olderThan))
      .collect();

    let deleted = 0;
    for (const reading of oldReadings) {
      await ctx.db.delete(reading._id);
      deleted++;
    }

    return { deleted };
  },
});
