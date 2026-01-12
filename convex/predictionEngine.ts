import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getSeverityFromHeight } from "./predictions";

/**
 * Prediction context loaded from database
 */
type PredictionContext = {
  currentReading: {
    value: number;
    timestamp: number;
  } | null;
  historicalReadings: Array<{
    value: number;
    timestamp: number;
  }>;
  recentWeather: Array<{
    humidity: number;
    rainfall1h: number | undefined;
    rainfall3h: number | undefined;
    weatherCondition: string;
    fetchedAt: number;
  }>;
};

/**
 * Load prediction context: historical readings and weather data
 */
export const loadPredictionContext = internalQuery({
  args: {
    deviceId: v.id("iotDevices"),
  },
  returns: v.object({
    currentReading: v.union(
      v.object({
        value: v.number(),
        timestamp: v.number(),
      }),
      v.null()
    ),
    historicalReadings: v.array(
      v.object({
        value: v.number(),
        timestamp: v.number(),
      })
    ),
    recentWeather: v.array(
      v.object({
        humidity: v.number(),
        rainfall1h: v.optional(v.number()),
        rainfall3h: v.optional(v.number()),
        weatherCondition: v.string(),
        fetchedAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, args): Promise<PredictionContext> => {
    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    // Get all readings for this device
    const allReadings = await ctx.db
      .query("sensorReadings")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    // Filter to water_level readings from last 2 hours, sorted by timestamp
    const waterLevelReadings = allReadings
      .filter(
        (r) =>
          r.readingType === "water_level" && r.timestamp >= twoHoursAgo
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    // Get current reading (most recent)
    const currentReading =
      waterLevelReadings.length > 0
        ? {
            value: waterLevelReadings[0].value,
            timestamp: waterLevelReadings[0].timestamp,
          }
        : null;

    // Get historical readings (last 6-12 readings, up to 2 hours back)
    const historicalReadings = waterLevelReadings
      .slice(0, 12)
      .map((r) => ({
        value: r.value,
        timestamp: r.timestamp,
      }))
      .reverse(); // Oldest first for trend calculation

    // Get recent weather data from shared pool (last 24 hours)
    const weatherData = await ctx.runQuery(
      internal.weather.getRecentWeather,
      {
        hours: 24,
      }
    );

    const recentWeather = weatherData.map((w: {
      humidity: number;
      rainfall1h?: number;
      rainfall3h?: number;
      weatherCondition: string;
      fetchedAt: number;
    }) => ({
      humidity: w.humidity,
      rainfall1h: w.rainfall1h,
      rainfall3h: w.rainfall3h,
      weatherCondition: w.weatherCondition,
      fetchedAt: w.fetchedAt,
    }));

    return {
      currentReading,
      historicalReadings,
      recentWeather,
    };
  },
});

/**
 * Calculate historical trend factor
 * Returns rate of change per hour (cm/hour)
 */
function calculateTrendFactor(
  historicalReadings: Array<{ value: number; timestamp: number }>
): number {
  if (historicalReadings.length < 2) {
    return 0; // No trend if insufficient data
  }

  // Calculate linear regression slope
  const n = historicalReadings.length;
  const sumX = historicalReadings.reduce(
    (sum, r) => sum + (r.timestamp - historicalReadings[0].timestamp) / (1000 * 60 * 60),
    0
  );
  const sumY = historicalReadings.reduce((sum, r) => sum + r.value, 0);
  const sumXY = historicalReadings.reduce(
    (sum, r) =>
      sum +
      r.value *
        ((r.timestamp - historicalReadings[0].timestamp) / (1000 * 60 * 60)),
    0
  );
  const sumX2 = historicalReadings.reduce(
    (sum, r) =>
      sum +
      Math.pow((r.timestamp - historicalReadings[0].timestamp) / (1000 * 60 * 60), 2),
    0
  );

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope || 0;
}

/**
 * Calculate weather correlation factor
 * Returns impact on water level in cm
 */
function calculateWeatherFactor(
  recentWeather: Array<{
    humidity: number;
    rainfall1h: number | undefined;
    rainfall3h: number | undefined;
    weatherCondition: string;
    fetchedAt: number;
  }>
): number {
  if (recentWeather.length === 0) {
    return 0;
  }

  // Get most recent weather
  const latestWeather = recentWeather[0];

  let impact = 0;

  // Rainfall impact: 1mm rainfall ≈ 0.1-0.5cm water level increase (depending on drainage)
  // Use conservative estimate of 0.2cm per mm
  if (latestWeather.rainfall1h !== undefined) {
    impact += latestWeather.rainfall1h * 0.2;
  }
  if (latestWeather.rainfall3h !== undefined) {
    // 3h rainfall contributes less per hour
    impact += (latestWeather.rainfall3h / 3) * 0.15;
  }

  // Weather condition multipliers
  const conditionMultipliers: Record<string, number> = {
    Rain: 1.2,
    Drizzle: 1.1,
    Thunderstorm: 1.5,
    HeavyRain: 1.8,
    Clear: 0.9,
    Clouds: 1.0,
  };
  const multiplier =
    conditionMultipliers[latestWeather.weatherCondition] ?? 1.0;
  impact *= multiplier;

  // High humidity (>80%) indicates potential for more rain
  if (latestWeather.humidity > 80) {
    impact *= 1.1;
  }

  return impact;
}

/**
 * Generate prediction for a specific time horizon
 */
function generatePredictionForHorizon(
  currentLevel: number,
  trendFactor: number, // cm/hour
  weatherFactor: number, // cm impact
  hours: number
): {
  predictedWaterLevel: number;
  floodProbability: number;
} {
  // Project water level: current + trend projection + weather impact
  const trendProjection = trendFactor * hours;
  const projectedLevel = currentLevel + trendProjection + weatherFactor * hours;

  // Ensure non-negative
  const predictedWaterLevel = Math.max(0, projectedLevel);

  // Calculate flood probability based on predicted level
  // Probability increases as level approaches critical thresholds
  let floodProbability = 0;
  if (predictedWaterLevel >= 100) {
    floodProbability = 0.95; // Critical
  } else if (predictedWaterLevel >= 50) {
    floodProbability = 0.7 + (predictedWaterLevel - 50) / 50 * 0.25; // High
  } else if (predictedWaterLevel >= 20) {
    floodProbability = 0.3 + (predictedWaterLevel - 20) / 30 * 0.4; // Medium
  } else {
    floodProbability = predictedWaterLevel / 20 * 0.3; // Low
  }

  // Clamp probability between 0 and 1
  floodProbability = Math.min(1, Math.max(0, floodProbability));

  return {
    predictedWaterLevel,
    floodProbability,
  };
}

/**
 * Main prediction generation orchestrator
 */
export const generatePrediction = internalAction({
  args: {
    deviceId: v.id("iotDevices"),
    readingId: v.optional(v.id("sensorReadings")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Load prediction context
    const context = await ctx.runQuery(
      internal.predictionEngine.loadPredictionContext,
      {
        deviceId: args.deviceId,
      }
    );

    // Need at least a current reading to generate predictions
    if (!context.currentReading) {
      console.log(
        `No current water level reading found for device ${args.deviceId}, skipping prediction`
      );
      return null;
    }

    const currentLevel = context.currentReading.value;

    // Calculate factors
    const trendFactor = calculateTrendFactor(context.historicalReadings);
    const weatherFactor = calculateWeatherFactor(context.recentWeather);

    // Generate predictions for each time horizon
    const timeHorizons: Array<"1h" | "2h" | "4h" | "8h"> = ["1h", "2h", "4h", "8h"];
    const horizonHours: Record<"1h" | "2h" | "4h" | "8h", number> = {
      "1h": 1,
      "2h": 2,
      "4h": 4,
      "8h": 8,
    };

    const predictions = timeHorizons.map((horizon) => {
      const hours = horizonHours[horizon];
      const { predictedWaterLevel, floodProbability } =
        generatePredictionForHorizon(currentLevel, trendFactor, weatherFactor, hours);
      const severity = getSeverityFromHeight(predictedWaterLevel);

      return {
        timeHorizon: horizon,
        floodProbability,
        predictedWaterLevel,
        severity,
        predictedAt: Date.now(),
        validUntil: Date.now() + hours * 60 * 60 * 1000,
        metadata: {
          currentLevel,
          trendFactor,
          weatherFactor,
          historicalReadingsCount: context.historicalReadings.length,
          weatherDataCount: context.recentWeather.length,
        },
      };
    });

    // Save predictions and update roads/alerts
    await ctx.runMutation(
      internal.predictionEngine.savePredictionsAndUpdateRoads,
      {
        deviceId: args.deviceId,
        predictions,
      }
    );

    return null;
  },
});

/**
 * Save predictions and trigger road/alert updates
 */
export const savePredictionsAndUpdateRoads = internalMutation({
  args: {
    deviceId: v.id("iotDevices"),
    predictions: v.array(
      v.object({
        timeHorizon: v.union(
          v.literal("1h"),
          v.literal("2h"),
          v.literal("4h"),
          v.literal("8h")
        ),
        floodProbability: v.number(),
        predictedWaterLevel: v.number(),
        severity: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("critical")
        ),
        predictedAt: v.number(),
        validUntil: v.number(),
        metadata: v.optional(v.any()),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Save all predictions
    for (const pred of args.predictions) {
      await ctx.runMutation(api.predictions.upsert, {
        deviceId: args.deviceId,
        timeHorizon: pred.timeHorizon,
        floodProbability: pred.floodProbability,
        predictedWaterLevel: pred.predictedWaterLevel,
        severity: pred.severity,
        predictedAt: pred.predictedAt,
        validUntil: pred.validUntil,
        metadata: pred.metadata,
      });
    }

    // Update road statuses based on predictions
    await ctx.runMutation(
      api.roadSegments.updateStatusesFromDevicePrediction,
      {
        deviceId: args.deviceId,
      }
    );

    // Update alerts based on predictions
    await ctx.runMutation(api.alerts.updateFromPredictions, {
      deviceId: args.deviceId,
    });

    return null;
  },
});
