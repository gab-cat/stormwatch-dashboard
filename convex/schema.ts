import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  roads: defineTable({
    name: v.string(),
    coordinates: v.array(v.array(v.number())), // [[lat, lng], [lat, lng], ...]
    status: v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded")),
    updatedAt: v.number(),
  }),
});
