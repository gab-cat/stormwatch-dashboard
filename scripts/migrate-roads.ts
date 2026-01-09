#!/usr/bin/env bun

/**
 * Migrate Road Segments to Add Spatial Fields
 * 
 * This script populates spatial fields (gridCell, bounding box) for existing road segments
 * that were created before the spatial optimization was added.
 * 
 * Usage: bun scripts/migrate-roads.ts
 * 
 * Note: Make sure your Convex deployment is running (bun run convex:dev in another terminal)
 */

import { resolve } from "path";
import { execSync } from "child_process";

const BATCH_SIZE = 500; // Process in batches of 500 segments

async function migrateSpatialFields() {
  console.log("🚀 StormWatch Road Segments Spatial Migration\n");
  console.log("📊 Adding gridCell and bounding box fields to existing road segments...\n");

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalProcessed = 0;
  let isDone = false;
  let batchNum = 0;
  let cursor: string | null = null;

  while (!isDone) {
    batchNum++;
    try {
      // Build args with cursor for pagination
      const args = cursor 
        ? { limit: BATCH_SIZE, cursor }
        : { limit: BATCH_SIZE };
      const argsJson = JSON.stringify(args).replace(/'/g, "'\\''");
      
      const command = `bunx convex run roadSegments:migrateSpatialFields '${argsJson}'`;
      const output = execSync(command, {
        cwd: resolve(import.meta.dir, ".."),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Parse result
      const jsonMatch = output.match(/\{[\s\S]*"updated"[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        totalUpdated += result.updated || 0;
        totalSkipped += result.skipped || 0;
        totalProcessed += result.processed || 0;
        isDone = result.isDone;
        cursor = result.continueCursor;

        console.log(
          `   Batch ${batchNum}: Updated ${result.updated}, Skipped ${result.skipped}, Processed ${result.processed}`
        );
      } else {
        isDone = true;
      }
    } catch (error: any) {
      console.error(`   ❌ Error migrating batch ${batchNum}:`);
      console.error(error.message);
      if (error.stderr) {
        console.error(error.stderr.toString());
      }
      process.exit(1);
    }

    // Small delay between batches to avoid rate limits
    if (!isDone) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Migration Complete!");
  console.log("=".repeat(50));
  console.log(`📊 Total Updated: ${totalUpdated}`);
  console.log(`⏭️  Total Skipped: ${totalSkipped}`);
  console.log(`📦 Total Processed: ${totalProcessed}`);
  console.log("\n🎉 All road segments now have spatial optimization fields!");
}

// Run the migration
migrateSpatialFields().catch((error) => {
  console.error("\n❌ Migration failed:", error);
  process.exit(1);
});
