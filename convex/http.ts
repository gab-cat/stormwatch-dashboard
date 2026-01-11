import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * Register a new IoT device (admin only - should be protected by Clerk in production)
 * POST /v1/devices/register
 */
http.route({
  path: "/v1/devices/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.location || !body.owner) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, type, location, owner" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate API key (simple UUID-like string)
    const apiKey = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const deviceId = await ctx.runMutation(api.devices.create, {
      apiKey,
      name: body.name,
      type: body.type,
      capabilities: body.capabilities || [],
      owner: body.owner,
      location: body.location, // [lat, lng]
      metadata: body.metadata,
      isEnabled: false, // API-registered devices start disabled for security
    });

    return new Response(
      JSON.stringify({
        success: true,
        deviceId,
        apiKey, // Return API key only once during registration
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  }),
});

/**
 * Submit sensor reading from IoT device
 * POST /v1/readings
 * Requires: Authorization header with API key (Bearer <apiKey>)
 */
http.route({
  path: "/v1/readings",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Extract API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

    // Find device by API key
    const device = await ctx.runQuery(api.devices.getByApiKey, { apiKey });
    if (!device) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if device is enabled
    if (!device.isEnabled) {
      return new Response(
        JSON.stringify({ error: "Device is disabled. Please enable the device in the dashboard to submit readings." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if device is alive (optional check)
    if (!device.isAlive) {
      // Optionally update device status
      await ctx.runMutation(api.devices.updateAliveStatus, {
        deviceId: device._id,
        isAlive: true,
      });
    }

    const body = await request.json();

    // Validate reading data
    if (
      body.readingType === undefined ||
      body.value === undefined ||
      body.unit === undefined
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: readingType, value, unit",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create sensor reading
    const readingId = await ctx.runMutation(api.readings.create, {
      deviceId: device._id,
      readingType: body.readingType,
      value: body.value,
      unit: body.unit,
      timestamp: body.timestamp || Date.now(),
      metadata: body.metadata,
    });

    // Update device lastSeen timestamp
    await ctx.runMutation(api.devices.updateLastSeen, {
      deviceId: device._id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        readingId,
        deviceId: device._id,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  }),
});

/**
 * Device heartbeat/ping to indicate device is alive
 * POST /v1/devices/heartbeat
 * Requires: Authorization header with API key
 */
http.route({
  path: "/v1/devices/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.substring(7);
    const device = await ctx.runQuery(api.devices.getByApiKey, { apiKey });

    if (!device) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if device is enabled
    if (!device.isEnabled) {
      return new Response(
        JSON.stringify({ error: "Device is disabled. Please enable the device in the dashboard to send heartbeats." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update device alive status and last seen
    await ctx.runMutation(api.devices.updateAliveStatus, {
      deviceId: device._id,
      isAlive: true,
    });
    await ctx.runMutation(api.devices.updateLastSeen, {
      deviceId: device._id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        deviceId: device._id,
        timestamp: Date.now(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

/**
 * Receive flood predictions from external prediction server
 * POST /v1/predictions
 * Can be protected with a webhook secret if needed
 */
http.route({
  path: "/v1/predictions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();

    // Validate webhook secret if provided (optional security)
    // const webhookSecret = request.headers.get("X-Webhook-Secret");
    // In production, validate against stored secret
    // if (webhookSecret !== process.env.PREDICTION_WEBHOOK_SECRET) {
    //   return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
    //     status: 401,
    //   });
    // }

    // Validate prediction data structure
    if (!body.deviceId || !body.predictions || !Array.isArray(body.predictions)) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: deviceId, predictions (array)",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = [];

    // Process each prediction (1h, 2h, 4h, 8h)
    for (const pred of body.predictions) {
      if (
        !pred.timeHorizon ||
        pred.floodProbability === undefined ||
        !pred.severity
      ) {
        continue; // Skip invalid predictions
      }

      const predictionId = await ctx.runMutation(api.predictions.upsert, {
        deviceId: body.deviceId,
        timeHorizon: pred.timeHorizon,
        floodProbability: pred.floodProbability,
        predictedWaterLevel: pred.predictedWaterLevel,
        severity: pred.severity,
        predictedAt: pred.predictedAt || Date.now(),
        validUntil: pred.validUntil || Date.now() + 8 * 60 * 60 * 1000, // Default 8 hours
        metadata: pred.metadata,
      });

      results.push({ timeHorizon: pred.timeHorizon, predictionId });
    }

    // Optionally create/update alerts based on predictions
    if (body.createAlerts !== false) {
      await ctx.runMutation(api.alerts.updateFromPredictions, {
        deviceId: body.deviceId,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deviceId: body.deviceId,
        predictionsCreated: results.length,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
