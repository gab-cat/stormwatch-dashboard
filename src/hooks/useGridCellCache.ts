import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { calculateGridCells, expandBounds } from '../lib/gridUtils';

type RoadSegment = {
  _id: Id<"roadSegments">;
  name: string;
  coordinates: number[][];
  status: "clear" | "risk" | "flooded";
  gridCell?: string;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  updatedAt: number;
  [key: string]: any;
};

interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface UseGridCellCacheOptions {
  viewportBounds: ViewportBounds;
  buffer?: number; // Buffer percentage for pre-fetching (default: 0.2)
  updateCheckInterval?: number; // How often to check for updates in ms (default: 30000 = 30s)
}

/**
 * Custom hook for managing grid-cell based road segment caching
 * Implements Google Maps-style tile caching with incremental loading
 */
export function useGridCellCache({
  viewportBounds,
  buffer = 0.2,
  updateCheckInterval = 30000,
}: UseGridCellCacheOptions) {
  // Track which grid cells have been loaded
  const loadedCellsRef = useRef<Set<string>>(new Set());
  
  // Store all segments by ID (persistent cache)
  const segmentsCacheRef = useRef<Map<string, RoadSegment>>(new Map());
  
  // Track last update check timestamp
  const lastUpdateCheckRef = useRef<number>(Date.now());
  
  // Force re-render when cache updates
  const [cacheVersion, setCacheVersion] = useState(0);

  // Expand viewport bounds for pre-fetching
  const expandedBounds = useMemo(
    () => expandBounds(viewportBounds, buffer),
    [viewportBounds, buffer]
  );

  // Calculate grid cells for expanded viewport
  const visibleCells = useMemo(
    () => calculateGridCells(expandedBounds),
    [expandedBounds]
  );

  // Find cells that haven't been loaded yet
  const missingCells = useMemo(() => {
    return visibleCells.filter((cell) => !loadedCellsRef.current.has(cell));
  }, [visibleCells]);

  // Fetch missing grid cells
  const gridCellsData = useQuery(
    api.roadSegments.getByGridCells,
    missingCells.length > 0 ? { gridCells: missingCells } : "skip"
  );

  // Subscribe to updates for loaded cells (real-time updates)
  const loadedCellsArray = useMemo(
    () => Array.from(loadedCellsRef.current),
    [cacheVersion]
  );

  const updatesData = useQuery(
    api.roadSegments.getUpdatesForCells,
    loadedCellsArray.length > 0
      ? {
          gridCells: loadedCellsArray,
          sinceTimestamp: lastUpdateCheckRef.current,
        }
      : "skip"
  );

  // Process new grid cell data and update cache
  useEffect(() => {
    if (gridCellsData?.segments) {
      let cacheUpdated = false;

      // Add new segments to cache
      gridCellsData.segments.forEach((segment) => {
        const existing = segmentsCacheRef.current.get(segment._id);
        // Update if new or if updatedAt is newer
        if (!existing || segment.updatedAt > existing.updatedAt) {
          segmentsCacheRef.current.set(segment._id, segment);
          cacheUpdated = true;
        }
      });

      // Mark cells as loaded
      gridCellsData.cells.forEach((cell) => {
        loadedCellsRef.current.add(cell);
      });

      if (cacheUpdated || gridCellsData.cells.length > 0) {
        setCacheVersion((v) => v + 1);
      }
    }
  }, [gridCellsData]);

  // Process update data and refresh cache
  useEffect(() => {
    if (updatesData?.segments && updatesData.segments.length > 0) {
      let cacheUpdated = false;

      updatesData.segments.forEach((segment) => {
        const existing = segmentsCacheRef.current.get(segment._id);
        // Update if newer
        if (!existing || segment.updatedAt > existing.updatedAt) {
          segmentsCacheRef.current.set(segment._id, segment);
          cacheUpdated = true;
        }
      });

      if (cacheUpdated) {
        setCacheVersion((v) => v + 1);
      }

      // Update last check timestamp
      lastUpdateCheckRef.current = Date.now();
    }
  }, [updatesData]);

  // Periodically check for updates
  useEffect(() => {
    if (loadedCellsArray.length === 0) return;

    const interval = setInterval(() => {
      lastUpdateCheckRef.current = Date.now();
      // Trigger re-query by updating cache version
      setCacheVersion((v) => v + 1);
    }, updateCheckInterval);

    return () => clearInterval(interval);
  }, [loadedCellsArray.length, updateCheckInterval]);

  // Get segments visible in current viewport (not expanded)
  const visibleSegments = useMemo(() => {
    const allSegments = Array.from(segmentsCacheRef.current.values());
    
    return allSegments.filter((segment) => {
      // Check if segment bounding box intersects with viewport
      if (
        segment.minLat === undefined ||
        segment.maxLat === undefined ||
        segment.minLng === undefined ||
        segment.maxLng === undefined
      ) {
        return false;
      }

      return (
        segment.minLat <= viewportBounds.maxLat &&
        segment.maxLat >= viewportBounds.minLat &&
        segment.minLng <= viewportBounds.maxLng &&
        segment.maxLng >= viewportBounds.minLng
      );
    });
  }, [viewportBounds, cacheVersion]);

  // Check if we're currently fetching data
  const isFetching = missingCells.length > 0 && gridCellsData === undefined;
  
  // Check if this is the initial load
  const isInitialLoad = loadedCellsRef.current.size === 0 && isFetching;

  // Clear cache (useful for testing or reset)
  const clearCache = useCallback(() => {
    loadedCellsRef.current.clear();
    segmentsCacheRef.current.clear();
    lastUpdateCheckRef.current = Date.now();
    setCacheVersion((v) => v + 1);
  }, []);

  return {
    segments: visibleSegments,
    isFetching,
    isInitialLoad,
    loadedCellCount: loadedCellsRef.current.size,
    totalCachedSegments: segmentsCacheRef.current.size,
    clearCache,
  };
}
