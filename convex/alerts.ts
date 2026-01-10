import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { getPassability } from "./predictions";

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
    affectedDeviceIds: v.array(v.id("iotDevices")),
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
      affectedDeviceIds: args.affectedDeviceIds,
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
    deviceId: v.id("iotDevices"),
  },
  handler: async (ctx, args) => {
    // Get latest predictions for this device
    const predictions = await ctx.runQuery(api.predictions.getLatestByDevice, {
      deviceId: args.deviceId,
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
    const highestPrediction = predictions.reduce<Doc<"predictions">>(
      (max: Doc<"predictions">, pred: Doc<"predictions">) => {
        const maxSeverity: "low" | "medium" | "high" | "critical" = max.severity;
        const predSeverity: "low" | "medium" | "high" | "critical" = pred.severity;
        return severityOrder[predSeverity] > severityOrder[maxSeverity]
          ? pred
          : max;
      },
      predictions[0]
    );

    if (!highestPrediction || highestPrediction.severity === "low") {
      // No alert needed for low severity
      return;
    }

    // Check if alert already exists for this device
    const existingAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const existingAlert = existingAlerts.find((alert) =>
      alert.affectedDeviceIds.includes(args.deviceId)
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
      const predictionSeverity: "low" | "medium" | "high" | "critical" = highestPrediction.severity;
      const newSeverity = severityOrder[predictionSeverity];

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
        const highestSeverity: "low" | "medium" | "high" | "critical" = highestPrediction.severity;
        
        // Build message with flood height and passability
        const waterLevel = highestPrediction.predictedWaterLevel ?? 0;
        const passability = getPassability(waterLevel);
        let message = `Flood height predicted: ${waterLevel.toFixed(0)}cm`;
        if (waterLevel > 0) {
          const passabilityInfo = [];
          if (!passability.vehicles) passabilityInfo.push("vehicles");
          if (!passability.humans) passabilityInfo.push("humans");
          if (passabilityInfo.length > 0) {
            message += ` - Road impassable for ${passabilityInfo.join(" and ")}`;
          }
        }
        
        await ctx.db.patch(existingAlert._id, {
          severity: severityMap[highestSeverity],
          message: message,
        });
      }
    } else {
      // Create new alert
      const device = await ctx.db.get(args.deviceId);
      
      // Build message with flood height and passability
      const waterLevel = highestPrediction.predictedWaterLevel ?? 0;
      const passability = getPassability(waterLevel);
      let message = `Flood height predicted: ${waterLevel.toFixed(0)}cm`;
      if (waterLevel > 0) {
        const passabilityInfo = [];
        if (!passability.vehicles) passabilityInfo.push("vehicles");
        if (!passability.humans) passabilityInfo.push("humans");
        if (passabilityInfo.length > 0) {
          message += ` - Road impassable for ${passabilityInfo.join(" and ")}`;
        }
      }
      
      await ctx.db.insert("alerts", {
        title: `Flood Alert: ${device?.name || "Device"}`,
        message: message,
        severity:
          highestPrediction.severity === "critical"
            ? "critical"
            : highestPrediction.severity === "high"
            ? "danger"
            : "warning",
        affectedDeviceIds: [args.deviceId],
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
