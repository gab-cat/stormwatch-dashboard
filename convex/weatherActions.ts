"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

/**
 * Fetch weather data for Naga City, Philippines (shared pool for all devices)
 * Used by cron job to periodically update weather data
 * Coordinates: 13.6218°N, 123.1948°E
 */
export const fetchNagaCityWeather = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Naga City, Philippines coordinates
    const latitude = 13.6218;
    const longitude = 123.1948;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENWEATHER_API_KEY environment variable not set. " +
        "Please set it in your Convex dashboard: Settings > Environment Variables. " +
        "After setting it, you may need to wait a few minutes for Convex to reload."
      );
    }

    // Trim whitespace that might have been accidentally added
    const trimmedApiKey = apiKey.trim();

    // Validate API key format (should be 32 characters)
    if (trimmedApiKey.length < 20) {
      throw new Error(
        `OPENWEATHER_API_KEY appears to be invalid (length: ${trimmedApiKey.length}). ` +
        "OpenWeatherMap API keys are typically 32 characters long. " +
        "Please verify your API key at https://home.openweathermap.org/api_keys"
      );
    }

    // Log first few characters for debugging (without exposing full key)
    console.log(`Fetching weather for Naga City (${latitude}, ${longitude}) using API key starting with: ${trimmedApiKey.substring(0, 4)}... (length: ${trimmedApiKey.length})`);

    // Fetch current weather data from OpenWeatherMap
    // Using Current Weather Data API endpoint
    // Reference: https://openweathermap.org/current
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${trimmedApiKey}&units=metric`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenWeatherMap API error: ${response.status} - ${errorText}`;
        
        if (response.status === 401) {
          errorMessage += "\n\n" +
            "The API key is invalid or not activated. Please:\n" +
            "1. Verify your API key at https://home.openweathermap.org/api_keys\n" +
            "2. Make sure the key is set correctly in Convex: Settings > Environment Variables\n" +
            "3. Note: New API keys may take 10-60 minutes to activate\n" +
            "4. Ensure you're using the correct API key (not the example key)";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Extract relevant weather data (no deviceId for shared pool)
      const weatherData = {
        deviceId: undefined, // Not needed for shared pool
        latitude,
        longitude,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        rainfall1h: data.rain?.["1h"] ?? undefined,
        rainfall3h: data.rain?.["3h"] ?? undefined,
        weatherCondition: data.weather[0]?.main ?? "Unknown",
        weatherDescription: data.weather[0]?.description ?? "Unknown",
        windSpeed: data.wind?.speed ?? 0,
        cloudCoverage: data.clouds?.all ?? 0,
        fetchedAt: Date.now(),
      };

      // Store weather data
      await ctx.runMutation(internal.weather.storeWeatherData, weatherData);
      
      console.log(`Successfully fetched and stored weather data for Naga City`);
    } catch (error) {
      console.error(`Error fetching weather for Naga City:`, error);
      throw error;
    }

    return null;
  },
});

/**
 * @deprecated Use fetchNagaCityWeather instead. This function fetches weather per device which is inefficient.
 * Kept for backward compatibility only.
 */
export const fetchWeatherForDevice = internalAction({
  args: {
    deviceId: v.id("iotDevices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get device to retrieve location
    const device = await ctx.runQuery(api.devices.getById, {
      id: args.deviceId,
    });

    if (!device) {
      throw new Error(`Device ${args.deviceId} not found`);
    }

    const [latitude, longitude] = device.location;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENWEATHER_API_KEY environment variable not set. " +
        "Please set it in your Convex dashboard: Settings > Environment Variables. " +
        "After setting it, you may need to wait a few minutes for Convex to reload."
      );
    }

    // Trim whitespace that might have been accidentally added
    const trimmedApiKey = apiKey.trim();

    // Validate API key format (should be 32 characters)
    if (trimmedApiKey.length < 20) {
      throw new Error(
        `OPENWEATHER_API_KEY appears to be invalid (length: ${trimmedApiKey.length}). ` +
        "OpenWeatherMap API keys are typically 32 characters long. " +
        "Please verify your API key at https://home.openweathermap.org/api_keys"
      );
    }

    // Log first few characters for debugging (without exposing full key)
    console.log(`Using API key starting with: ${trimmedApiKey.substring(0, 4)}... (length: ${trimmedApiKey.length})`);

    // Fetch current weather data from OpenWeatherMap
    // Using Current Weather Data API endpoint
    // Reference: https://openweathermap.org/current
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${trimmedApiKey}&units=metric`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenWeatherMap API error: ${response.status} - ${errorText}`;
        
        if (response.status === 401) {
          errorMessage += "\n\n" +
            "The API key is invalid or not activated. Please:\n" +
            "1. Verify your API key at https://home.openweathermap.org/api_keys\n" +
            "2. Make sure the key is set correctly in Convex: Settings > Environment Variables\n" +
            "3. Note: New API keys may take 10-60 minutes to activate\n" +
            "4. Ensure you're using the correct API key (not the example key)";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Extract relevant weather data
      const weatherData = {
        deviceId: args.deviceId,
        latitude,
        longitude,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        rainfall1h: data.rain?.["1h"] ?? undefined,
        rainfall3h: data.rain?.["3h"] ?? undefined,
        weatherCondition: data.weather[0]?.main ?? "Unknown",
        weatherDescription: data.weather[0]?.description ?? "Unknown",
        windSpeed: data.wind?.speed ?? 0,
        cloudCoverage: data.clouds?.all ?? 0,
        fetchedAt: Date.now(),
      };

      // Store weather data
      await ctx.runMutation(internal.weather.storeWeatherData, weatherData);
    } catch (error) {
      console.error(`Error fetching weather for device ${args.deviceId}:`, error);
      throw error;
    }

    return null;
  },
});

/**
 * @deprecated Use fetchNagaCityWeather instead. This function makes multiple API calls which is inefficient.
 * Kept for backward compatibility only.
 */
export const fetchAllDevicesWeather = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get all enabled devices
    const devices = await ctx.runQuery(api.devices.getAll, {});

    // Filter to only enabled devices
    const enabledDevices = devices.filter(
      (device: { isEnabled?: boolean }) => device.isEnabled !== false
    );

    // Fetch weather for each device in parallel
    const fetchPromises = enabledDevices.map((device: { _id: any }) =>
      ctx.runAction(internal.weatherActions.fetchWeatherForDevice, {
        deviceId: device._id,
      }).catch((error) => {
        // Log error but don't fail the entire batch
        console.error(
          `Failed to fetch weather for device ${device._id}:`,
          error
        );
        return null;
      })
    );

    await Promise.all(fetchPromises);

    return null;
  },
});
