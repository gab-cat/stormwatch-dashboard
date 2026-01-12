import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fetch weather data for Naga City (shared pool) every 15 minutes
crons.interval(
  "fetch-weather-data",
  { minutes: 15 },
  internal.weatherActions.fetchNagaCityWeather,
  {}
);

export default crons;
