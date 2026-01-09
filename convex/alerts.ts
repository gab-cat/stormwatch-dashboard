import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Get all alerts
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alerts").collect();
  },
});

/**
 * Get active alerts only
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * Get alerts by severity
 */
export const getBySeverity = query({
  args: {
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("danger"),
      v.literal("critical")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_severity", (q) => q.eq("severity", args.severity))
      .collect();
  },
});

/**
 * Create a new alert
 */
export const create = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("danger"),
      v.literal("critical")
    ),
    affectedZoneIds: v.array(v.id("floodZones")),
    affectedRoadIds: v.optional(v.array(v.id("roadSegments"))),
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("alerts", {
      title: args.title,
      message: args.message,
      severity: args.severity,
      affectedZoneIds: args.affectedZoneIds,
      affectedRoadIds: args.affectedRoadIds,
      isActive: args.isActive ?? true,
      startsAt: args.startsAt || now,
      expiresAt: args.expiresAt,
      createdAt: now,
    });
  },
});

/**
 * Update alert status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("alerts"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
    });
  },
});

/**
 * Update alerts based on predictions (auto-generate alerts for high-risk predictions)
 */
export const updateFromPredictions = mutation({
  args: {
    zoneId: v.id("floodZones"),
  },
  handler: async (ctx, args) => {
    // Get latest predictions for this zone
    const predictions = await ctx.runQuery(api.predictions.getLatestByZone, {
      zoneId: args.zoneId,
    });

    if (predictions.length === 0) {
      return;
    }

    // Find highest severity prediction
    const severityOrder: Record<"low" | "medium" | "high" | "critical", number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };
    const highestPrediction = predictions.reduce<typeof predictions[0]>(
      (max, pred) => {
        return severityOrder[pred.severity] > severityOrder[max.severity]
          ? pred
          : max;
      },
      predictions[0]
    );

    if (!highestPrediction || highestPrediction.severity === "low") {
      // No alert needed for low severity
      return;
    }

    // Check if alert already exists for this zone
    const existingAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const existingAlert = existingAlerts.find((alert) =>
      alert.affectedZoneIds.includes(args.zoneId)
    );

    if (existingAlert) {
      // Update existing alert if severity increased
      // Map alert severity to prediction severity for comparison
      const alertSeverityMap: Record<
        "info" | "warning" | "danger" | "critical",
        "low" | "medium" | "high" | "critical"
      > = {
        info: "low",
        warning: "medium",
        danger: "high",
        critical: "critical",
      };
      const mappedAlertSeverity = alertSeverityMap[existingAlert.severity];
      const currentSeverity = severityOrder[mappedAlertSeverity];
      const newSeverity = severityOrder[highestPrediction.severity];

      if (newSeverity > currentSeverity) {
        // Map prediction severity to alert severity
        const severityMap: Record<
          "low" | "medium" | "high" | "critical",
          "info" | "warning" | "danger" | "critical"
        > = {
          low: "info",
          medium: "warning",
          high: "danger",
          critical: "critical",
        };
        await ctx.db.patch(existingAlert._id, {
          severity: severityMap[highestPrediction.severity],
          message: `Flood risk predicted: ${(highestPrediction.floodProbability * 100).toFixed(0)}% probability`,
        });
      }
    } else {
      // Create new alert
      const zone = await ctx.db.get(args.zoneId);
      await ctx.db.insert("alerts", {
        title: `Flood Alert: ${zone?.name || "Zone"}`,
        message: `Flood risk predicted: ${(highestPrediction.floodProbability * 100).toFixed(0)}% probability`,
        severity:
          highestPrediction.severity === "critical"
            ? "critical"
            : highestPrediction.severity === "high"
            ? "danger"
            : "warning",
        affectedZoneIds: [args.zoneId],
        isActive: true,
        startsAt: Date.now(),
        expiresAt: highestPrediction.validUntil,
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * Delete an alert
 */
export const remove = mutation({
  args: {
    id: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
