#!/usr/bin/env bun

/**
 * Send Sensor Reading Test Script
 * 
 * This script sends sensor readings for different severity levels to test
 * the flood prediction system.
 * 
 * Usage: bun scripts/send-reading.ts <api-key> [--url <convex-url>]
 * 
 * Example: bun scripts/send-reading.ts sk_1234567890_abc123 --url https://your-deployment.convex.site
 */

interface Scenario {
  name: string;
  description: string;
  value: number; // Water level in cm
  unit: string;
}

const SCENARIOS: Scenario[] = [
  {
    name: "Low",
    description: "Low severity (< 20cm) - Normal conditions",
    value: 10,
    unit: "cm",
  },
  {
    name: "Medium",
    description: "Medium severity (20-50cm) - Caution advised",
    value: 35,
    unit: "cm",
  },
  {
    name: "High",
    description: "High severity (50-100cm) - Significant flood risk",
    value: 75,
    unit: "cm",
  },
  {
    name: "Critical",
    description: "Critical severity (≥ 100cm) - Extreme flood danger",
    value: 120,
    unit: "cm",
  },
];

interface ReadingRequest {
  readingType: "water_level";
  value: number;
  unit: string;
  timestamp?: number;
  metadata?: any;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): { apiKey: string | null; url: string | null } {
  const args = process.argv.slice(2);
  let apiKey: string | null = null;
  let url: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && i + 1 < args.length) {
      url = args[i + 1];
      i++;
    } else if (!apiKey && !args[i].startsWith("--")) {
      apiKey = args[i];
    }
  }

  return { apiKey, url };
}

/**
 * Helper function to prompt user for input
 */
function promptUser(question: string): Promise<string> {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Get Convex deployment URL from various sources
 */
async function getConvexUrl(cliUrl: string | null): Promise<string> {
  // 1. Check CLI argument
  if (cliUrl) {
    return cliUrl;
  }

  // 2. Check environment variable
  const envUrl = process.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // 3. Prompt user
  console.error("Convex deployment URL not found.");
  console.error("Please provide it via:");
  console.error("  - --url flag: bun scripts/send-reading.ts <api-key> --url <url>");
  console.error("  - CONVEX_URL environment variable");
  console.error("  - Or enter it now:");
  console.error("");

  const answer = await promptUser("Convex URL: ");
  if (!answer) {
    console.error("Error: URL is required");
    process.exit(1);
  }
  return answer;
}

/**
 * Display scenario menu and get user selection
 */
async function selectScenario(): Promise<Scenario> {
  console.error("\nSelect a scenario to send:");
  console.error("");

  SCENARIOS.forEach((scenario, index) => {
    console.error(`  ${index + 1}. ${scenario.name} - ${scenario.description}`);
    console.error(`     Water Level: ${scenario.value}${scenario.unit}`);
    console.error("");
  });

  const answer = await promptUser("Enter scenario number (1-4): ");
  const selection = parseInt(answer, 10);

  if (isNaN(selection) || selection < 1 || selection > SCENARIOS.length) {
    console.error(`Error: Invalid selection. Please enter a number between 1 and ${SCENARIOS.length}`);
    process.exit(1);
  }

  return SCENARIOS[selection - 1];
}

/**
 * Send reading to Convex API
 */
async function sendReading(
  apiKey: string,
  baseUrl: string,
  scenario: Scenario
): Promise<void> {
  // Ensure baseUrl doesn't end with a slash
  const cleanUrl = baseUrl.replace(/\/$/, "");
  const endpoint = `${cleanUrl}/v1/readings`;

  const reading: ReadingRequest = {
    readingType: "water_level",
    value: scenario.value,
    unit: scenario.unit,
    timestamp: Date.now(),
    metadata: {
      scenario: scenario.name,
      testScript: true,
    },
  };

  console.error(`\nSending reading to ${endpoint}...`);
  console.error(`  Scenario: ${scenario.name}`);
  console.error(`  Water Level: ${scenario.value}${scenario.unit}`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(reading),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`\n❌ Error: ${response.status} ${response.statusText}`);
      if (data.error) {
        console.error(`   ${data.error}`);
      }
      process.exit(1);
    }

    console.error("\n✓ Successfully sent reading!");
    console.error(`  Reading ID: ${data.readingId}`);
    console.error(`  Device ID: ${data.deviceId}`);
    console.error(`  Timestamp: ${new Date(reading.timestamp!).toISOString()}`);
  } catch (error) {
    console.error("\n❌ Network error:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Parse arguments
    const { apiKey, url } = parseArgs();

    if (!apiKey) {
      console.error("Error: API key is required");
      console.error("");
      console.error("Usage: bun scripts/send-reading.ts <api-key> [--url <convex-url>]");
      console.error("");
      console.error("Example:");
      console.error("  bun scripts/send-reading.ts sk_1234567890_abc123");
      console.error("  bun scripts/send-reading.ts sk_1234567890_abc123 --url https://your-deployment.convex.site");
      process.exit(1);
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith("sk_")) {
      console.error("Warning: API key should start with 'sk_'");
    }

    // Get Convex URL
    const convexUrl = await getConvexUrl(url);
    console.error(`Using Convex URL: ${convexUrl}`);

    // Select scenario
    const scenario = await selectScenario();

    // Send reading
    await sendReading(apiKey, convexUrl, scenario);

    console.error("\n✓ Done!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
