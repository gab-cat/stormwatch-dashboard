import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all flood zones
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("floodZones").collect();
  },
});

/**
 * Get zone by ID
 */
export const getById = query({
  args: {
    id: v.id("floodZones"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new flood zone
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    polygon: v.array(v.array(v.number())), // [[lat, lng], ...]
    center: v.array(v.number()), // [lat, lng]
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("floodZones", {
      name: args.name,
      description: args.description,
      polygon: args.polygon,
      center: args.center,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a flood zone
 */
export const update = mutation({
  args: {
    id: v.id("floodZones"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    polygon: v.optional(v.array(v.array(v.number()))),
    center: v.optional(v.array(v.number())),
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
 * Delete a flood zone
 */
export const remove = mutation({
  args: {
    id: v.id("floodZones"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
