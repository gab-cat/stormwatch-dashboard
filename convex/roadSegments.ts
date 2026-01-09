import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { PaginationOptions, PaginationResult } from "convex/server";

/**
 * Calculate grid cell ID from coordinates (0.01 degree precision ~1km)
 */
function getGridCell(lat: number, lng: number): string {
  const gridSize = 0.01;
  const gridLat = Math.floor(lat / gridSize) * gridSize;
  const gridLng = Math.floor(lng / gridSize) * gridSize;
  return `${gridLat.toFixed(2)}_${gridLng.toFixed(2)}`;
}

/**
 * Calculate bounding box for a set of coordinates
 */
function calculateBoundingBox(
  coordinates: number[][]
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  if (coordinates.length === 0) {
    throw new Error("Coordinates array cannot be empty");
  }

  let minLat = coordinates[0][0];
  let maxLat = coordinates[0][0];
  let minLng = coordinates[0][1];
  let maxLng = coordinates[0][1];

  for (const [lat, lng] of coordinates) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Calculate all grid cells that intersect with a bounding box
 */
function calculateGridCells(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): string[] {
  const gridSize = 0.01;
  const cells = new Set<string>();

  // Calculate grid cell range
  const minGridLat = Math.floor(bounds.minLat / gridSize) * gridSize;
  const maxGridLat = Math.ceil(bounds.maxLat / gridSize) * gridSize;
  const minGridLng = Math.floor(bounds.minLng / gridSize) * gridSize;
  const maxGridLng = Math.ceil(bounds.maxLng / gridSize) * gridSize;

  // Generate all grid cells in the range
  for (let lat = minGridLat; lat <= maxGridLat; lat += gridSize) {
    for (let lng = minGridLng; lng <= maxGridLng; lng += gridSize) {
      cells.add(getGridCell(lat, lng));
    }
  }

  return Array.from(cells);
}

/**
 * Compute spatial fields for a road segment
 */
function computeSpatialFields(coordinates: number[][]) {
  const bbox = calculateBoundingBox(coordinates);
  // Use the first coordinate's grid cell as the primary cell
  const gridCell = getGridCell(coordinates[0][0], coordinates[0][1]);
  return {
    gridCell,
    minLat: bbox.minLat,
    maxLat: bbox.maxLat,
    minLng: bbox.minLng,
    maxLng: bbox.maxLng,
  };
}

/**
 * Get all road segments
 * @deprecated Use getByViewport for map display or getPaginated for admin panel
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roadSegments").collect();
  },
});

/**
 * Get road segments visible in the current map viewport
 * Uses grid cell indexing for efficient spatial queries
 */
export const getByViewport = query({
  args: {
    minLat: v.number(),
    maxLat: v.number(),
    minLng: v.number(),
    maxLng: v.number(),
  },
  handler: async (ctx, args) => {
    // Calculate grid cells that intersect with viewport
    const gridCells = calculateGridCells({
      minLat: args.minLat,
      maxLat: args.maxLat,
      minLng: args.minLng,
      maxLng: args.maxLng,
    });

    // Fetch roads from each visible grid cell (indexed query - efficient)
    const results = await Promise.all(
      gridCells.map((cell) =>
        ctx.db
          .query("roadSegments")
          .withIndex("by_gridCell", (q) => q.eq("gridCell", cell))
          .collect()
      )
    );

    // Flatten and filter to ensure roads actually intersect with viewport
    // (some roads may span multiple grid cells)
    const allRoads = results.flat();
    const uniqueRoads = new Map();
    
    for (const road of allRoads) {
      // Check if road bounding box intersects with viewport
      if (
        road.minLat !== undefined &&
        road.maxLat !== undefined &&
        road.minLng !== undefined &&
        road.maxLng !== undefined
      ) {
        const intersects =
          road.minLat <= args.maxLat &&
          road.maxLat >= args.minLat &&
          road.minLng <= args.maxLng &&
          road.maxLng >= args.minLng;

        if (intersects && !uniqueRoads.has(road._id)) {
          uniqueRoads.set(road._id, road);
        }
      }
      // Note: Roads without spatial fields won't appear until migration is run
      // This is intentional for performance - run migrate-roads.ts script first
    }

    return Array.from(uniqueRoads.values());
  },
});

/**
 * Pagination options validator
 */
const paginationOptsValidator = v.object({
  numItems: v.number(),
  cursor: v.union(v.string(), v.null()),
});

/**
 * Get paginated road segments for admin panel
 * Supports optional status filtering
 */
export const getPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded"))
    ),
  },
  handler: async (ctx, args): Promise<PaginationResult<any>> => {
    if (args.status) {
      return await ctx.db
        .query("roadSegments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    } else {
      return await ctx.db
        .query("roadSegments")
        .paginate(args.paginationOpts);
    }
  },
});

/**
 * Get road segments by status
 */
export const getByStatus = query({
  args: {
    status: v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roadSegments")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

/**
 * Get a single road segment by ID
 */
export const getById = query({
  args: {
    id: v.id("roadSegments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Bulk import road segments from OSM data
 * Expects array of road segments with osmId, name, coordinates, roadType
 * 
 * Note: Use clearBatch() before importing if you want to replace all data
 */
export const bulkImport = mutation({
  args: {
    segments: v.array(
      v.object({
        osmId: v.optional(v.string()),
        name: v.string(),
        coordinates: v.array(v.array(v.number())),
        roadType: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let imported = 0;
    let skipped = 0;

    // Track osmIds we've inserted in this batch to avoid duplicates within the batch
    const insertedInBatch = new Set<string>();

    // Insert segments with indexed duplicate checking
    for (const segment of args.segments) {
      // Skip if already inserted in this batch
      if (segment.osmId && insertedInBatch.has(segment.osmId)) {
        skipped++;
        continue;
      }

      // Use indexed lookup to check for existing document (efficient: reads only 1 doc)
      if (segment.osmId) {
        const existing = await ctx.db
          .query("roadSegments")
          .withIndex("by_osmId", (q) => q.eq("osmId", segment.osmId))
          .first();

        if (existing) {
          skipped++;
          continue;
        }
      }

      // Compute spatial fields for efficient querying
      const spatialFields = computeSpatialFields(segment.coordinates);

      await ctx.db.insert("roadSegments", {
        osmId: segment.osmId,
        name: segment.name,
        coordinates: segment.coordinates,
        roadType: segment.roadType,
        status: "clear" as const,
        createdAt: now,
        updatedAt: now,
        ...spatialFields,
      });

      // Track this osmId to prevent duplicates within this batch
      if (segment.osmId) {
        insertedInBatch.add(segment.osmId);
      }

      imported++;
    }

    return {
      imported,
      skipped,
      total: args.segments.length,
    };
  },
});

/**
 * Update road segment status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("roadSegments"),
    status: v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Create a new road segment manually
 */
export const create = mutation({
  args: {
    name: v.string(),
    coordinates: v.array(v.array(v.number())),
    roadType: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("clear"), v.literal("risk"), v.literal("flooded"))
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Compute spatial fields for efficient querying
    const spatialFields = computeSpatialFields(args.coordinates);
    
    return await ctx.db.insert("roadSegments", {
      name: args.name,
      coordinates: args.coordinates,
      roadType: args.roadType,
      status: args.status || ("clear" as const),
      createdAt: now,
      updatedAt: now,
      ...spatialFields,
    });
  },
});

/**
 * Delete a road segment
 */
export const remove = mutation({
  args: {
    id: v.id("roadSegments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Clear road segments in batches (to avoid hitting read limits)
 * Call this repeatedly until hasMore is false
 */
export const clearBatch = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchLimit = args.limit ?? 5000;
    const toDelete = await ctx.db.query("roadSegments").take(batchLimit);

    for (const doc of toDelete) {
      await ctx.db.delete(doc._id);
    }

    return {
      deleted: toDelete.length,
      hasMore: toDelete.length === batchLimit,
    };
  },
});

/**
 * Migrate existing road segments to add spatial fields (gridCell, bounding box)
 * Uses cursor-based pagination to process all documents
 * Call this repeatedly until isDone is true
 */
export const migrateSpatialFields = mutation({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const batchLimit = args.limit ?? 500;
    const paginationResult = await ctx.db
      .query("roadSegments")
      .paginate({ numItems: batchLimit, cursor: args.cursor ?? null });

    let updated = 0;
    let skipped = 0;

    for (const segment of paginationResult.page) {
      // Skip if already has spatial fields
      if (
        segment.gridCell &&
        segment.minLat !== undefined &&
        segment.maxLat !== undefined &&
        segment.minLng !== undefined &&
        segment.maxLng !== undefined
      ) {
        skipped++;
        continue;
      }

      // Compute spatial fields
      try {
        const spatialFields = computeSpatialFields(segment.coordinates);
        await ctx.db.patch(segment._id, spatialFields);
        updated++;
      } catch (error) {
        console.error(`Error migrating segment ${segment._id}:`, error);
        skipped++;
      }
    }

    return {
      updated,
      skipped,
      processed: paginationResult.page.length,
      continueCursor: paginationResult.continueCursor,
      isDone: paginationResult.isDone,
    };
  },
});
