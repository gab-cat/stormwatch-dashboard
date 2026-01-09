import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all IoT devices
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("iotDevices").collect();
  },
});

/**
 * Get device by API key (for HTTP action authentication)
 */
export const getByApiKey = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("iotDevices")
      .withIndex("by_apiKey", (q) => q.eq("apiKey", args.apiKey))
      .first();
  },
});

/**
 * Get device by ID
 */
export const getById = query({
  args: {
    id: v.id("iotDevices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get devices by type
 */
export const getByType = query({
  args: {
    type: v.union(
      v.literal("water_level"),
      v.literal("rain_gauge"),
      v.literal("flow_meter"),
      v.literal("multi_sensor")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("iotDevices")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

/**
 * Get alive devices
 */
export const getAlive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("iotDevices")
      .withIndex("by_alive", (q) => q.eq("isAlive", true))
      .collect();
  },
});

/**
 * Create a new IoT device
 */
export const create = mutation({
  args: {
    apiKey: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("water_level"),
      v.literal("rain_gauge"),
      v.literal("flow_meter"),
      v.literal("multi_sensor")
    ),
    capabilities: v.array(v.string()),
    owner: v.string(),
    location: v.array(v.number()), // [lat, lng]
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("iotDevices", {
      apiKey: args.apiKey,
      name: args.name,
      type: args.type,
      capabilities: args.capabilities,
      owner: args.owner,
      location: args.location,
      isAlive: true,
      lastSeen: now,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update device alive status
 */
export const updateAliveStatus = mutation({
  args: {
    deviceId: v.id("iotDevices"),
    isAlive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deviceId, {
      isAlive: args.isAlive,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update device last seen timestamp
 */
export const updateLastSeen = mutation({
  args: {
    deviceId: v.id("iotDevices"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deviceId, {
      lastSeen: Date.now(),
      isAlive: true, // Also mark as alive
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update device information
 */
export const update = mutation({
  args: {
    id: v.id("iotDevices"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("water_level"),
        v.literal("rain_gauge"),
        v.literal("flow_meter"),
        v.literal("multi_sensor")
      )
    ),
    capabilities: v.optional(v.array(v.string())),
    owner: v.optional(v.string()),
    location: v.optional(v.array(v.number())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a device
 */
export const remove = mutation({
  args: {
    id: v.id("iotDevices"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Regenerate API key for a device
 */
export const regenerateApiKey = mutation({
  args: {
    id: v.id("iotDevices"),
  },
  handler: async (ctx, args) => {
    const newApiKey = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await ctx.db.patch(args.id, {
      apiKey: newApiKey,
      updatedAt: Date.now(),
    });
    return newApiKey;
  },
});
