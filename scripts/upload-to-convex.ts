#!/usr/bin/env bun

/**
 * Upload Roads to Convex
 * 
 * This script uploads the roads-data.json file to Convex using the bulkImport mutation.
 * It handles batching to avoid size limits and provides progress feedback.
 * 
 * Usage: bun scripts/upload-to-convex.ts
 * 
 * Note: Make sure your Convex deployment is running (bun run convex:dev in another terminal)
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

interface RoadSegment {
  osmId: string;
  name: string;
  coordinates: number[][];
  roadType?: string;
}

const ROADS_DATA_PATH = resolve(import.meta.dir, "../roads-data.json");
const BATCH_SIZE = 300; // Upload in batches of 300 segments (smaller for indexed duplicate checks)
const CLEAR_BATCH_SIZE = 5000; // Delete in batches of 5000

async function clearExistingSegments() {
  console.log("🗑️  Clearing existing road segments...");
  let totalDeleted = 0;
  let hasMore = true;
  let batchNum = 0;

  while (hasMore) {
    batchNum++;
    try {
      const command = `bunx convex run roadSegments:clearBatch '{"limit": ${CLEAR_BATCH_SIZE}}'`;
      const output = execSync(command, {
        cwd: resolve(import.meta.dir, ".."),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Parse result
      const jsonMatch = output.match(/\{[\s\S]*"deleted"[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        totalDeleted += result.deleted || 0;
        hasMore = result.hasMore;
        if (result.deleted > 0) {
          console.log(`   Batch ${batchNum}: Deleted ${result.deleted} segments`);
        }
      } else {
        hasMore = false;
      }
    } catch (error: any) {
      console.error(`   ❌ Error clearing batch ${batchNum}:`);
      console.error(error.message);
      process.exit(1);
    }

    // Small delay between clear batches
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  if (totalDeleted > 0) {
    console.log(`   ✓ Cleared ${totalDeleted} existing segments\n`);
  } else {
    console.log(`   ✓ No existing segments to clear\n`);
  }
}

async function uploadToConvex() {
  console.log("🚀 StormWatch Road Data Uploader\n");

  // Check if roads-data.json exists
  if (!existsSync(ROADS_DATA_PATH)) {
    console.error("❌ Error: roads-data.json not found!");
    console.error("   Please run: bun scripts/import-roads.ts > roads-data.json");
    process.exit(1);
  }

  // Load road segments
  console.log("📂 Loading roads-data.json...");
  const roadSegments: RoadSegment[] = await Bun.file(ROADS_DATA_PATH).json();
  console.log(`   Found ${roadSegments.length} road segments\n`);

  // Clear existing segments first
  await clearExistingSegments();

  // Calculate batches
  const totalBatches = Math.ceil(roadSegments.length / BATCH_SIZE);
  console.log(`📦 Uploading in ${totalBatches} batch(es) of up to ${BATCH_SIZE} segments each\n`);

  let totalImported = 0;
  let totalSkipped = 0;

  // Process in batches
  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, roadSegments.length);
    const batch = roadSegments.slice(batchStart, batchEnd);

    console.log(`⏳ Batch ${i + 1}/${totalBatches}: Uploading segments ${batchStart + 1}-${batchEnd}...`);

    try {
      const batchData = {
        segments: batch,
      };

      // Escape the JSON for shell
      const argsJson = JSON.stringify(batchData).replace(/'/g, "'\\''");

      // Call Convex mutation via CLI
      const command = `bunx convex run roadSegments:bulkImport '${argsJson}'`;
      const output = execSync(command, {
        cwd: resolve(import.meta.dir, ".."),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Parse result from output
      try {
        // The output might have extra text, try to find JSON
        const jsonMatch = output.match(/\{[\s\S]*"imported"[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          totalImported += result.imported || 0;
          totalSkipped += result.skipped || 0;
          console.log(`   ✓ Imported: ${result.imported}, Skipped: ${result.skipped}`);
        } else {
          console.log(`   ✓ Batch ${i + 1} completed`);
          totalImported += batch.length;
        }
      } catch {
        console.log(`   ✓ Batch ${i + 1} completed`);
        totalImported += batch.length;
      }

    } catch (error: any) {
      console.error(`   ❌ Error uploading batch ${i + 1}:`);
      console.error(error.message);
      if (error.stderr) {
        console.error(error.stderr.toString());
      }
      process.exit(1);
    }

    // Small delay between batches to avoid rate limits
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Upload Complete!");
  console.log("=".repeat(50));
  console.log(`📊 Total Imported: ${totalImported}`);
  console.log(`⏭️  Total Skipped:  ${totalSkipped}`);
  console.log(`📦 Total Segments: ${roadSegments.length}`);
  console.log("\n🎉 Your road network is now ready in Convex!");
}

// Run the upload
uploadToConvex().catch((error) => {
  console.error("\n❌ Upload failed:", error);
  process.exit(1);
});
