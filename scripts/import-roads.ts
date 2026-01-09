#!/usr/bin/env bun

/**
 * OSM Road Network Import Script for Naga City
 * 
 * This script queries OpenStreetMap Overpass API for road networks in Naga City,
 * transforms the data into our roadSegments format, and outputs JSON.
 * 
 * Usage: bun scripts/import-roads.ts > roads-data.json
 */

const NAGA_CITY_BBOX = {
  south: 13.58,
  west: 123.15,
  north: 13.66,
  east: 123.22,
};

interface OSMWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: {
    name?: string;
    highway?: string;
    [key: string]: string | undefined;
  };
}

interface OSMNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
}

interface OSMResponse {
  elements: (OSMWay | OSMNode)[];
}

interface RoadSegment {
  osmId: string;
  name: string;
  coordinates: number[][];
  roadType?: string;
}

async function fetchOSMRoads(): Promise<RoadSegment[]> {
  const { south, west, north, east } = NAGA_CITY_BBOX;
  
  // Overpass QL query to get all highways/roads in bounding box
  const query = `
    [out:json][timeout:25];
    (
      way["highway"]["highway"!~"^(footway|path|cycleway|steps|bridleway)$"](${south},${west},${north},${east});
    );
    out geom;
  `;

  const overpassUrl = "https://overpass-api.de/api/interpreter";
  
  console.error("Fetching road data from OpenStreetMap...");
  const response = await fetch(overpassUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.statusText}`);
  }

  const data: OSMResponse = await response.json();
  console.error(`Fetched ${data.elements.length} elements from OSM`);

  // Separate nodes and ways
  const nodes = new Map<number, OSMNode>();
  const ways: OSMWay[] = [];

  for (const element of data.elements) {
    if (element.type === "node") {
      nodes.set(element.id, element);
    } else if (element.type === "way") {
      ways.push(element);
    }
  }

  console.error(`Found ${nodes.size} nodes and ${ways.length} ways`);

  // Transform ways into road segments
  const roadSegments: RoadSegment[] = [];

  for (const way of ways) {
    // Skip if no geometry data (shouldn't happen with out geom, but safety check)
    if (!("geometry" in way)) {
      continue;
    }

    const geometry = (way as any).geometry as Array<{ lat: number; lon: number }>;
    
    if (!geometry || geometry.length < 2) {
      continue; // Skip invalid geometries
    }

    // Extract coordinates
    const coordinates = geometry.map((point) => [point.lat, point.lon]);

    // Get road name (prefer name tag, fallback to highway type)
    const name = way.tags?.name || way.tags?.highway || `Road ${way.id}`;
    const roadType = way.tags?.highway || "unknown";

    roadSegments.push({
      osmId: way.id.toString(),
      name,
      coordinates,
      roadType,
    });
  }

  console.error(`Generated ${roadSegments.length} road segments`);
  return roadSegments;
}

// Main execution
async function main() {
  try {
    const roadSegments = await fetchOSMRoads();
    
    // Output JSON for Convex import
    console.log(JSON.stringify(roadSegments, null, 2));
    console.error("\n✓ Successfully exported road segments to JSON");
    console.error(`  Total segments: ${roadSegments.length}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
