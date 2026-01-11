import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Legacy roads table (kept for backward compatibility)
  roads: defineTable({
    name: v.string(),
    coordinates: v.array(v.array(v.number())), // [[lat, lng], [lat, lng], ...]
    status: v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded")),
    updatedAt: v.number(),
  }),

  // OSM road segments with detailed metadata
  roadSegments: defineTable({
    osmId: v.optional(v.string()), // OSM way ID
    name: v.string(),
    coordinates: v.array(v.array(v.number())), // [[lat, lng], [lat, lng], ...]
    roadType: v.optional(v.string()), // highway, residential, etc.
    status: v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded")),
    updatedAt: v.number(),
    createdAt: v.number(),
    // Spatial optimization fields for efficient viewport queries
    gridCell: v.optional(v.string()), // "13.61_123.18" format for tile-based indexing
    minLat: v.optional(v.number()),
    maxLat: v.optional(v.number()),
    minLng: v.optional(v.number()),
    maxLng: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_osmId", ["osmId"])
    .index("by_gridCell", ["gridCell"]),


  // IoT device registry
  iotDevices: defineTable({
    apiKey: v.string(), // For authentication
    name: v.string(),
    type: v.union(
      v.literal("water_level"),
      v.literal("rain_gauge"),
      v.literal("flow_meter"),
      v.literal("multi_sensor")
    ),
    capabilities: v.array(v.string()), // ["water_level", "temperature", etc.]
    owner: v.string(), // Owner/organization name
    location: v.array(v.number()), // [lat, lng]
    influenceRadius: v.number(), // Influence radius in meters (default 500m)
    isAlive: v.boolean(),
    isEnabled: v.optional(v.boolean()), // Whether device is enabled to submit readings
    lastSeen: v.number(),
    metadata: v.optional(v.any()), // Additional device-specific data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_apiKey", ["apiKey"])
    .index("by_type", ["type"])
    .index("by_alive", ["isAlive"])
    .index("by_enabled", ["isEnabled"]),

  // Sensor readings from IoT devices
  sensorReadings: defineTable({
    deviceId: v.id("iotDevices"),
    readingType: v.union(
      v.literal("water_level"),
      v.literal("rainfall"),
      v.literal("flow_rate"),
      v.literal("temperature"),
      v.literal("humidity")
    ),
    value: v.number(),
    unit: v.string(), // "cm", "mm", "m/s", etc.
    timestamp: v.number(),
    metadata: v.optional(v.any()), // Additional reading data
  })
    .index("by_device", ["deviceId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["readingType"]),

  // Flood predictions from external server
  predictions: defineTable({
    deviceId: v.id("iotDevices"),
    timeHorizon: v.union(
      v.literal("1h"),
      v.literal("2h"),
      v.literal("4h"),
      v.literal("8h")
    ),
    floodProbability: v.number(), // 0-1
    predictedWaterLevel: v.optional(v.number()), // in cm
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    predictedAt: v.number(), // When prediction was made
    validUntil: v.number(), // When this prediction expires
    metadata: v.optional(v.any()), // Additional prediction data
  })
    .index("by_device", ["deviceId"])
    .index("by_horizon", ["timeHorizon"])
    .index("by_validUntil", ["validUntil"]),

  // Active alerts and warnings
  alerts: defineTable({
    title: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("danger"),
      v.literal("critical")
    ),
    affectedDeviceIds: v.array(v.id("iotDevices")),
    affectedRoadIds: v.optional(v.array(v.id("roadSegments"))),
    isActive: v.boolean(),
    startsAt: v.number(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_severity", ["severity"]),
});
