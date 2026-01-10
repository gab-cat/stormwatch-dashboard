/**
 * Grid cell calculation utilities for spatial indexing
 * Grid size: 0.01 degrees ≈ 1km
 */

const GRID_SIZE = 0.01;

/**
 * Calculate grid cell ID from coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns Grid cell ID in format "lat_lng" (e.g., "13.61_123.18")
 */
export function getGridCell(lat: number, lng: number): string {
  const gridLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
  const gridLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
  return `${gridLat.toFixed(2)}_${gridLng.toFixed(2)}`;
}

/**
 * Calculate all grid cells that intersect with a bounding box
 * @param bounds Bounding box coordinates
 * @returns Array of grid cell IDs
 */
export function calculateGridCells(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): string[] {
  const cells = new Set<string>();

  // Calculate grid cell range
  const minGridLat = Math.floor(bounds.minLat / GRID_SIZE) * GRID_SIZE;
  const maxGridLat = Math.ceil(bounds.maxLat / GRID_SIZE) * GRID_SIZE;
  const minGridLng = Math.floor(bounds.minLng / GRID_SIZE) * GRID_SIZE;
  const maxGridLng = Math.ceil(bounds.maxLng / GRID_SIZE) * GRID_SIZE;

  // Generate all grid cells in the range
  for (let lat = minGridLat; lat <= maxGridLat; lat += GRID_SIZE) {
    for (let lng = minGridLng; lng <= maxGridLng; lng += GRID_SIZE) {
      cells.add(getGridCell(lat, lng));
    }
  }

  return Array.from(cells);
}

/**
 * Expand viewport bounds by a buffer percentage for pre-fetching
 * @param bounds Original viewport bounds
 * @param buffer Buffer percentage (0.2 = 20%)
 * @returns Expanded bounds
 */
export function expandBounds(
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  },
  buffer: number = 0.2
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;

  return {
    minLat: bounds.minLat - latRange * buffer,
    maxLat: bounds.maxLat + latRange * buffer,
    minLng: bounds.minLng - lngRange * buffer,
    maxLng: bounds.maxLng + lngRange * buffer,
  };
}
