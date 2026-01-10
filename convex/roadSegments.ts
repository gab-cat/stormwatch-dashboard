import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { PaginationResult } from "convex/server";
import { getSeverityFromHeight } from "./predictions";

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
 * Get road segments for specific grid cells
 * Used for incremental loading - only fetches missing cells
 */
export const getByGridCells = query({
  args: {
    gridCells: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.gridCells.length === 0) {
      return { segments: [], cells: [] };
    }

    // Fetch segments for each requested grid cell
    const results = await Promise.all(
      args.gridCells.map((cell) =>
        ctx.db
          .query("roadSegments")
          .withIndex("by_gridCell", (q) => q.eq("gridCell", cell))
          .collect()
      )
    );

    // Flatten and deduplicate by ID (segments may span multiple cells)
    const allSegments = results.flat();
    const uniqueSegments = new Map();
    
    for (const segment of allSegments) {
      if (!uniqueSegments.has(segment._id)) {
        uniqueSegments.set(segment._id, segment);
      }
    }

    return {
      segments: Array.from(uniqueSegments.values()),
      cells: args.gridCells,
    };
  },
});

/**
 * Get updated segments for specific grid cells since a timestamp
 * Used for real-time updates - checks for changes in loaded cells
 */
export const getUpdatesForCells = query({
  args: {
    gridCells: v.array(v.string()),
    sinceTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.gridCells.length === 0) {
      return { segments: [], cells: [] };
    }

    // Fetch segments for each requested grid cell
    const results = await Promise.all(
      args.gridCells.map((cell) =>
        ctx.db
          .query("roadSegments")
          .withIndex("by_gridCell", (q) => q.eq("gridCell", cell))
          .collect()
      )
    );

    // Filter by timestamp if provided
    let allSegments = results.flat();
    if (args.sinceTimestamp !== undefined) {
      allSegments = allSegments.filter(
        (seg) => seg.updatedAt > args.sinceTimestamp!
      );
    }

    // Deduplicate by ID
    const uniqueSegments = new Map();
    for (const segment of allSegments) {
      if (!uniqueSegments.has(segment._id)) {
        uniqueSegments.set(segment._id, segment);
      }
    }

    return {
      segments: Array.from(uniqueSegments.values()),
      cells: args.gridCells,
    };
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

/**
 * Calculate Haversine distance between two points in meters
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
}

/**
 * Check if a road segment is within a radius of a point
 * Returns true if any coordinate of the road is within the radius
 */
function isRoadWithinRadius(
  roadCoordinates: number[][],
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean {
  // Check if any point of the road is within radius
  for (const coord of roadCoordinates) {
    const distance = haversineDistance(centerLat, centerLng, coord[0], coord[1]);
    if (distance <= radiusMeters) {
      return true;
    }
  }
  return false;
}

/**
 * Get road segments within a radius of a point
 * Uses efficient grid-cell indexing for spatial queries
 */
export const getRoadsWithinRadius = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusMeters: v.number(),
  },
  handler: async (ctx, args) => {
    // Calculate bounding box around the point with radius
    // Approximate: 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(latitude)
    const latDegrees = args.radiusMeters / 111000;
    const lngDegrees = args.radiusMeters / (111000 * Math.cos((args.lat * Math.PI) / 180));
    
    const bounds = {
      minLat: args.lat - latDegrees,
      maxLat: args.lat + latDegrees,
      minLng: args.lng - lngDegrees,
      maxLng: args.lng + lngDegrees,
    };

    // Get grid cells that intersect with bounding box
    const gridCells = calculateGridCells(bounds);

    // Fetch roads from each visible grid cell (indexed query - efficient)
    const results = await Promise.all(
      gridCells.map((cell) =>
        ctx.db
          .query("roadSegments")
          .withIndex("by_gridCell", (q) => q.eq("gridCell", cell))
          .collect()
      )
    );

    // Flatten and filter to ensure roads actually intersect with bounding box
    const allRoads = results.flat();
    const uniqueRoads = new Map();
    
    for (const road of allRoads) {
      // Check if road bounding box intersects with our bounding box
      if (
        road.minLat !== undefined &&
        road.maxLat !== undefined &&
        road.minLng !== undefined &&
        road.maxLng !== undefined
      ) {
        const intersects =
          road.minLat <= bounds.maxLat &&
          road.maxLat >= bounds.minLat &&
          road.minLng <= bounds.maxLng &&
          road.maxLng >= bounds.minLng;

        if (intersects && !uniqueRoads.has(road._id)) {
          // Check if road is actually within radius using Haversine distance
          if (isRoadWithinRadius(road.coordinates, args.lat, args.lng, args.radiusMeters)) {
            uniqueRoads.set(road._id, road);
          }
        }
      }
    }

    return Array.from(uniqueRoads.values());
  },
});

/**
 * Update road statuses based on device predictions
 * Maps severity to road status:
 * - critical/high → flooded
 * - medium → risk
 * - low → clear
 */
export const updateStatusesFromDevicePrediction = mutation({
  args: {
    deviceId: v.id("iotDevices"),
  },
  returns: v.union(
    v.object({
      updated: v.number(),
      message: v.string(),
    }),
    v.object({
      updated: v.number(),
      deviceId: v.id("iotDevices"),
      deviceName: v.string(),
      severity: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      status: v.union(
        v.literal("clear"),
        v.literal("risk"),
        v.literal("flooded")
      ),
    })
  ),
  handler: async (ctx, args) => {
    // Get the device
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    // Get latest predictions for this device
    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    if (predictions.length === 0) {
      return { updated: 0, message: "No predictions found for device" };
    }

    // Find the highest severity prediction based on flood height
    const now = Date.now();
    const validPredictions = predictions.filter(p => p.validUntil >= now && p.predictedWaterLevel !== undefined);
    
    if (validPredictions.length === 0) {
      return { updated: 0, message: "No valid predictions with water level data found" };
    }

    // Calculate severity from flood height for each prediction and find the maximum
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    let maxSeverity: "low" | "medium" | "high" | "critical" = "low";
    let maxHeight = 0;

    for (const pred of validPredictions) {
      if (pred.predictedWaterLevel !== undefined) {
        const severity = getSeverityFromHeight(pred.predictedWaterLevel);
        if (severityOrder[severity] > severityOrder[maxSeverity]) {
          maxSeverity = severity;
          maxHeight = pred.predictedWaterLevel;
        } else if (severityOrder[severity] === severityOrder[maxSeverity] && pred.predictedWaterLevel > maxHeight) {
          maxHeight = pred.predictedWaterLevel;
        }
      }
    }

    // Map severity to road status
    let targetStatus: "clear" | "risk" | "flooded";
    if (maxSeverity === "critical" || maxSeverity === "high") {
      targetStatus = "flooded";
    } else if (maxSeverity === "medium") {
      targetStatus = "risk";
    } else {
      targetStatus = "clear";
    }

    // Calculate bounding box around device location with radius
    const [deviceLat, deviceLng] = device.location;
    const latDegrees = device.influenceRadius / 111000;
    const lngDegrees = device.influenceRadius / (111000 * Math.cos((deviceLat * Math.PI) / 180));
    
    const bounds = {
      minLat: deviceLat - latDegrees,
      maxLat: deviceLat + latDegrees,
      minLng: deviceLng - lngDegrees,
      maxLng: deviceLng + lngDegrees,
    };

    // Get grid cells that intersect with bounding box
    const gridCells = calculateGridCells(bounds);

    // Fetch roads from each visible grid cell (indexed query - efficient)
    const results = await Promise.all(
      gridCells.map((cell) =>
        ctx.db
          .query("roadSegments")
          .withIndex("by_gridCell", (q) => q.eq("gridCell", cell))
          .collect()
      )
    );

    // Flatten and filter to roads actually within radius
    const allRoads = results.flat();
    const uniqueRoads = new Map();
    
    for (const road of allRoads) {
      // Check if road bounding box intersects with our bounding box
      if (
        road.minLat !== undefined &&
        road.maxLat !== undefined &&
        road.minLng !== undefined &&
        road.maxLng !== undefined
      ) {
        const intersects =
          road.minLat <= bounds.maxLat &&
          road.maxLat >= bounds.minLat &&
          road.minLng <= bounds.maxLng &&
          road.maxLng >= bounds.minLng;

        if (intersects && !uniqueRoads.has(road._id)) {
          // Check if road is actually within radius using Haversine distance
          if (isRoadWithinRadius(road.coordinates, deviceLat, deviceLng, device.influenceRadius)) {
            uniqueRoads.set(road._id, road);
          }
        }
      }
    }

    // Update road statuses
    let updated = 0;
    for (const road of uniqueRoads.values()) {
      await ctx.db.patch(road._id, {
        status: targetStatus,
        updatedAt: Date.now(),
      });
      updated++;
    }

    return {
      updated,
      deviceId: args.deviceId,
      deviceName: device.name,
      severity: maxSeverity,
      status: targetStatus,
    };
  },
});
