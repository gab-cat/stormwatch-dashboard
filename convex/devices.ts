import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
 * Get devices with location data for map display
 */
export const getWithLocations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("iotDevices").collect();
  },
});

/**
 * Get devices that influence a specific point (within their influence radius)
 */
export const getDevicesAffectingPoint = query({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const devices = await ctx.db.query("iotDevices").collect();
    
    // Haversine distance formula
    const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371000; // Earth radius in meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    
    return devices.filter((device) => {
      const [deviceLat, deviceLng] = device.location;
      const distance = haversineDistance(args.lat, args.lng, deviceLat, deviceLng);
      return distance <= device.influenceRadius;
    });
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
    influenceRadius: v.optional(v.number()), // in meters, default 500
    metadata: v.optional(v.any()),
    isEnabled: v.optional(v.boolean()), // Defaults to true for backward compatibility
  },
  returns: v.id("iotDevices"),
  handler: async (ctx, args): Promise<Id<"iotDevices">> => {
    const now = Date.now();
    
    return await ctx.db.insert("iotDevices", {
      apiKey: args.apiKey,
      name: args.name,
      type: args.type,
      capabilities: args.capabilities,
      owner: args.owner,
      location: args.location,
      influenceRadius: args.influenceRadius ?? 500, // Default 500 meters
      isAlive: true,
      isEnabled: args.isEnabled ?? true, // Default to true for backward compatibility
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
    influenceRadius: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return null;
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

/**
 * Set device enabled/disabled status
 */
export const setEnabled = mutation({
  args: {
    deviceId: v.id("iotDevices"),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deviceId, {
      isEnabled: args.isEnabled,
      updatedAt: Date.now(),
    });
  },
});
