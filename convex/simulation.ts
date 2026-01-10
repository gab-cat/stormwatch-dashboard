import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getSeverityFromHeight } from "./predictions";

/**
 * Preset simulation scenarios
 */
export const SCENARIOS = {
  normal: {
    name: "Normal Day",
    description: "Typical weather conditions with low water levels",
    waterLevel: { min: 5, max: 15 },
    floodProbability: { min: 0.05, max: 0.15 },
    severity: "low" as const,
  },
  lightRain: {
    name: "Light Rain",
    description: "Light rainfall with slightly elevated water levels",
    waterLevel: { min: 20, max: 40 },
    floodProbability: { min: 0.25, max: 0.40 },
    severity: "medium" as const,
  },
  heavyStorm: {
    name: "Heavy Storm",
    description: "Heavy rainfall with high flood risk",
    waterLevel: { min: 50, max: 80 },
    floodProbability: { min: 0.60, max: 0.80 },
    severity: "high" as const,
  },
  floodEvent: {
    name: "Flood Event",
    description: "Critical flooding conditions",
    waterLevel: { min: 100, max: 150 },
    floodProbability: { min: 0.85, max: 0.95 },
    severity: "critical" as const,
  },
};

/**
 * Generate random value within a range
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate multiple sensor readings for a device based on scenario
 */
export const generateReadingsForDevice = mutation({
  args: {
    deviceId: v.id("iotDevices"),
    scenario: v.union(
      v.literal("normal"),
      v.literal("lightRain"),
      v.literal("heavyStorm"),
      v.literal("floodEvent")
    ),
    count: v.optional(v.number()),
  },
  returns: v.object({
    readingIds: v.array(v.id("sensorReadings")),
    count: v.number(),
    scenario: v.union(
      v.literal("normal"),
      v.literal("lightRain"),
      v.literal("heavyStorm"),
      v.literal("floodEvent")
    ),
    deviceId: v.id("iotDevices"),
  }),
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const scenario = SCENARIOS[args.scenario];
    const count = args.count || 5;
    const readingIds: Array<Id<"sensorReadings">> = [];

    // Generate readings with slight variation
    for (let i = 0; i < count; i++) {
      const waterLevel = randomInRange(
        scenario.waterLevel.min,
        scenario.waterLevel.max
      );

      const readingId: Id<"sensorReadings"> = await ctx.runMutation(api.readings.create, {
        deviceId: args.deviceId,
        readingType: "water_level",
        value: parseFloat(waterLevel.toFixed(2)),
        unit: "cm",
        timestamp: Date.now() - (count - i - 1) * 60000, // Space readings 1 minute apart
        metadata: {
          scenario: args.scenario,
          simulated: true,
        },
      });

      readingIds.push(readingId);
    }

    // Update device last seen
    await ctx.runMutation(api.devices.updateLastSeen, {
      deviceId: args.deviceId,
    });

    return {
      readingIds,
      count: readingIds.length,
      scenario: args.scenario,
      deviceId: args.deviceId,
    };
  },
});

/**
 * Generate predictions for a device based on scenario
 */
export const generatePredictionsForDevice = mutation({
  args: {
    deviceId: v.id("iotDevices"),
    scenario: v.union(
      v.literal("normal"),
      v.literal("lightRain"),
      v.literal("heavyStorm"),
      v.literal("floodEvent")
    ),
  },
  returns: v.object({
    predictionIds: v.array(v.id("predictions")),
    count: v.number(),
    scenario: v.union(
      v.literal("normal"),
      v.literal("lightRain"),
      v.literal("heavyStorm"),
      v.literal("floodEvent")
    ),
    deviceId: v.id("iotDevices"),
    deviceName: v.string(),
  }),
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const scenario = SCENARIOS[args.scenario];
    const timeHorizons = ["1h", "2h", "4h", "8h"] as const;
    const predictionIds: Array<Id<"predictions">> = [];

    const now = Date.now();

    for (const horizon of timeHorizons) {
      const floodProbability = randomInRange(
        scenario.floodProbability.min,
        scenario.floodProbability.max
      );

      const predictedWaterLevel = randomInRange(
        scenario.waterLevel.min,
        scenario.waterLevel.max
      );

      // Calculate severity from flood height instead of using scenario severity
      const severity = getSeverityFromHeight(predictedWaterLevel);

      const predictionId: Id<"predictions"> = await ctx.runMutation(api.predictions.upsert, {
        deviceId: args.deviceId,
        timeHorizon: horizon,
        floodProbability: parseFloat(floodProbability.toFixed(2)),
        predictedWaterLevel: parseFloat(predictedWaterLevel.toFixed(2)),
        severity: severity,
        predictedAt: now,
        validUntil: now + 8 * 60 * 60 * 1000, // Valid for 8 hours
        metadata: {
          scenario: args.scenario,
          simulated: true,
        },
      });

      predictionIds.push(predictionId);
    }

    return {
      predictionIds,
      count: predictionIds.length,
      scenario: args.scenario,
      deviceId: args.deviceId,
      deviceName: device.name,
    };
  },
});

/**
 * Update road statuses based on device predictions
 */
export const updateRoadsFromPredictions = mutation({
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
  handler: async (ctx, args): Promise<
    | { updated: number; message: string }
    | {
        updated: number;
        deviceId: Id<"iotDevices">;
        deviceName: string;
        severity: "low" | "medium" | "high" | "critical";
        status: "clear" | "risk" | "flooded";
      }
  > => {
    return await ctx.runMutation(api.roadSegments.updateStatusesFromDevicePrediction, {
      deviceId: args.deviceId,
    });
  },
});

/**
 * Run a complete simulation scenario
 * This orchestrates all steps: readings → predictions → road updates
 */
export const runScenario = mutation({
  args: {
    deviceId: v.id("iotDevices"),
    scenario: v.union(
      v.literal("normal"),
      v.literal("lightRain"),
      v.literal("heavyStorm"),
      v.literal("floodEvent")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    scenario: v.union(
      v.literal("normal"),
      v.literal("lightRain"),
      v.literal("heavyStorm"),
      v.literal("floodEvent")
    ),
    scenarioName: v.string(),
    deviceId: v.id("iotDevices"),
    deviceName: v.string(),
    steps: v.object({
      readings: v.object({
        readingIds: v.array(v.id("sensorReadings")),
        count: v.number(),
        scenario: v.union(
          v.literal("normal"),
          v.literal("lightRain"),
          v.literal("heavyStorm"),
          v.literal("floodEvent")
        ),
        deviceId: v.id("iotDevices"),
      }),
      predictions: v.object({
        predictionIds: v.array(v.id("predictions")),
        count: v.number(),
        scenario: v.union(
          v.literal("normal"),
          v.literal("lightRain"),
          v.literal("heavyStorm"),
          v.literal("floodEvent")
        ),
        deviceId: v.id("iotDevices"),
        deviceName: v.string(),
      }),
      roads: v.union(
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
    }),
    duration: v.number(),
    timestamp: v.number(),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    scenario: "normal" | "lightRain" | "heavyStorm" | "floodEvent";
    scenarioName: string;
    deviceId: Id<"iotDevices">;
    deviceName: string;
    steps: {
      readings: {
        readingIds: Array<Id<"sensorReadings">>;
        count: number;
        scenario: "normal" | "lightRain" | "heavyStorm" | "floodEvent";
        deviceId: Id<"iotDevices">;
      };
      predictions: {
        predictionIds: Array<Id<"predictions">>;
        count: number;
        scenario: "normal" | "lightRain" | "heavyStorm" | "floodEvent";
        deviceId: Id<"iotDevices">;
        deviceName: string;
      };
      roads:
        | { updated: number; message: string }
        | {
            updated: number;
            deviceId: Id<"iotDevices">;
            deviceName: string;
            severity: "low" | "medium" | "high" | "critical";
            status: "clear" | "risk" | "flooded";
          };
    };
    duration: number;
    timestamp: number;
  }> => {
    const startTime = Date.now();

    // Step 1: Get device
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    // Step 2: Generate sensor readings
    const readingsResult: {
      readingIds: Array<Id<"sensorReadings">>;
      count: number;
      scenario: "normal" | "lightRain" | "heavyStorm" | "floodEvent";
      deviceId: Id<"iotDevices">;
    } = await ctx.runMutation(api.simulation.generateReadingsForDevice, {
      deviceId: args.deviceId,
      scenario: args.scenario,
      count: 5,
    });

    // Step 3: Generate predictions for the device
    const predictionsResult: {
      predictionIds: Array<Id<"predictions">>;
      count: number;
      scenario: "normal" | "lightRain" | "heavyStorm" | "floodEvent";
      deviceId: Id<"iotDevices">;
      deviceName: string;
    } = await ctx.runMutation(api.simulation.generatePredictionsForDevice, {
      deviceId: args.deviceId,
      scenario: args.scenario,
    });

    // Step 4: Update road statuses based on predictions
    const roadsResult: 
      | { updated: number; message: string }
      | {
          updated: number;
          deviceId: Id<"iotDevices">;
          deviceName: string;
          severity: "low" | "medium" | "high" | "critical";
          status: "clear" | "risk" | "flooded";
        } = await ctx.runMutation(api.simulation.updateRoadsFromPredictions, {
      deviceId: args.deviceId,
    });

    const endTime = Date.now();

    return {
      success: true,
      scenario: args.scenario,
      scenarioName: SCENARIOS[args.scenario].name,
      deviceId: args.deviceId,
      deviceName: device.name,
      steps: {
        readings: readingsResult,
        predictions: predictionsResult,
        roads: roadsResult,
      },
      duration: endTime - startTime,
      timestamp: startTime,
    };
  },
});

/**
 * Reset simulation data (clear simulated readings and predictions)
 */
export const resetSimulation = mutation({
  args: {
    deviceId: v.optional(v.id("iotDevices")),
  },
  handler: async (ctx, args) => {
    // If deviceId provided, only clear that device's simulated data
    // Otherwise, clear all simulated data
    
    let deletedReadings = 0;
    let deletedPredictions = 0;

    // Clear simulated readings
    const allReadings = await ctx.db.query("sensorReadings").collect();
    for (const reading of allReadings) {
      if (reading.metadata?.simulated) {
        if (!args.deviceId || reading.deviceId === args.deviceId) {
          await ctx.db.delete(reading._id);
          deletedReadings++;
        }
      }
    }

    // Clear simulated predictions
    const allPredictions = await ctx.db.query("predictions").collect();
    for (const prediction of allPredictions) {
      if (prediction.metadata?.simulated) {
        await ctx.db.delete(prediction._id);
        deletedPredictions++;
      }
    }

    return {
      deletedReadings,
      deletedPredictions,
    };
  },
});
