import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roads").collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("roads"),
    status: v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("roads").collect();
    if (existing.length > 0) return;

    const roads = [
      {
        name: "Magsaysay Avenue",
        coordinates: [
          [13.6330, 123.1960],
          [13.6280, 123.1920],
          [13.6230, 123.1880],
        ],
        status: "clear" as const,
      },
      {
        name: "Panganiban Drive",
        coordinates: [
          [13.6250, 123.1940],
          [13.6220, 123.1920],
          [13.6190, 123.1900],
        ],
        status: "clear" as const,
      },
      {
        name: "Elias Angeles",
        coordinates: [
          [13.6260, 123.1910],
          [13.6210, 123.1920],
          [13.6160, 123.1930],
        ],
        status: "risk" as const,
      },
      {
        name: "Penafrancia Avenue",
        coordinates: [
          [13.6350, 123.1910],
          [13.6320, 123.1920],
          [13.6290, 123.1930],
        ],
        status: "flooded" as const,
      },
    ];

    for (const road of roads) {
      await ctx.db.insert("roads", {
        ...road,
        updatedAt: Date.now(),
      });
    }
  },
});
