import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Store weather data in the database (shared pool for Naga City)
 */
export const storeWeatherData = internalMutation({
  args: {
    deviceId: v.optional(v.id("iotDevices")), // Optional for shared pool
    latitude: v.number(),
    longitude: v.number(),
    temperature: v.number(),
    humidity: v.number(),
    rainfall1h: v.optional(v.number()),
    rainfall3h: v.optional(v.number()),
    weatherCondition: v.string(),
    weatherDescription: v.string(),
    windSpeed: v.number(),
    cloudCoverage: v.number(),
    fetchedAt: v.number(),
  },
  returns: v.id("weatherData"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("weatherData", {
      deviceId: args.deviceId,
      latitude: args.latitude,
      longitude: args.longitude,
      temperature: args.temperature,
      humidity: args.humidity,
      rainfall1h: args.rainfall1h,
      rainfall3h: args.rainfall3h,
      weatherCondition: args.weatherCondition,
      weatherDescription: args.weatherDescription,
      windSpeed: args.windSpeed,
      cloudCoverage: args.cloudCoverage,
      fetchedAt: args.fetchedAt,
    });
  },
});

/**
 * Get recent weather data from shared pool (last 24 hours)
 * Returns weather data for Naga City, shared across all devices
 */
export const getRecentWeather = internalQuery({
  args: {
    hours: v.optional(v.number()), // Default 24 hours
  },
  returns: v.array(
    v.object({
      _id: v.id("weatherData"),
      _creationTime: v.number(),
      deviceId: v.optional(v.id("iotDevices")),
      latitude: v.number(),
      longitude: v.number(),
      temperature: v.number(),
      humidity: v.number(),
      rainfall1h: v.optional(v.number()),
      rainfall3h: v.optional(v.number()),
      weatherCondition: v.string(),
      weatherDescription: v.string(),
      windSpeed: v.number(),
      cloudCoverage: v.number(),
      fetchedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const hours = args.hours ?? 24;
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    // Get all weather data from shared pool (using fetchedAt index)
    const allWeather = await ctx.db
      .query("weatherData")
      .withIndex("by_fetchedAt")
      .collect();

    // Filter to last N hours and sort by fetchedAt descending
    return allWeather
      .filter((w) => w.fetchedAt >= cutoffTime)
      .sort((a, b) => b.fetchedAt - a.fetchedAt);
  },
});

/**
 * @deprecated Use getRecentWeather instead. This function filters by deviceId which is no longer needed for shared pool.
 * Kept for backward compatibility only.
 */
export const getRecentWeatherForDevice = internalQuery({
  args: {
    deviceId: v.id("iotDevices"),
    hours: v.optional(v.number()), // Default 24 hours
  },
  returns: v.array(
    v.object({
      _id: v.id("weatherData"),
      _creationTime: v.number(),
      deviceId: v.optional(v.id("iotDevices")),
      latitude: v.number(),
      longitude: v.number(),
      temperature: v.number(),
      humidity: v.number(),
      rainfall1h: v.optional(v.number()),
      rainfall3h: v.optional(v.number()),
      weatherCondition: v.string(),
      weatherDescription: v.string(),
      windSpeed: v.number(),
      cloudCoverage: v.number(),
      fetchedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const hours = args.hours ?? 24;
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    // Get all weather data (no deviceId index available anymore, so query all)
    const allWeather = await ctx.db
      .query("weatherData")
      .withIndex("by_fetchedAt")
      .collect();

    // Filter to this device and last N hours, sort by fetchedAt descending
    return allWeather
      .filter((w) => w.deviceId === args.deviceId && w.fetchedAt >= cutoffTime)
      .sort((a, b) => b.fetchedAt - a.fetchedAt);
  },
});
