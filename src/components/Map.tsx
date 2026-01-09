import { MapContainer, TileLayer, Polyline, Popup, useMapEvents } from 'react-leaflet';
import { api } from '../../convex/_generated/api';
import { useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { useEffect, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  onSelectRoad: (roadId: Id<"roadSegments"> | null) => void;
  selectedRoadId: Id<"roadSegments"> | null;
}

// Fix for Leaflet default icon issues in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to track viewport bounds and notify parent
function ViewportTracker({ onBoundsChange }: { onBoundsChange: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    },
  });

  // Initial bounds
  useEffect(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    });
  }, [map, onBoundsChange]);

  return null;
}

export default function Map({ onSelectRoad, selectedRoadId }: MapProps) {
  const center: [number, number] = [13.6139, 123.1853]; // Naga City
  
  // Initial bounds estimate (roughly 5km radius at zoom 14)
  const initialBounds = {
    minLat: center[0] - 0.045,
    maxLat: center[0] + 0.045,
    minLng: center[1] - 0.045,
    maxLng: center[1] + 0.045,
  };

  const [viewportBounds, setViewportBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }>(initialBounds);

  // Debounce viewport bounds updates
  const [debouncedBounds, setDebouncedBounds] = useState(initialBounds);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBounds(viewportBounds);
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [viewportBounds]);

  // Use viewport-based query for efficient loading
  const roadSegments = useQuery(api.roadSegments.getByViewport, {
    minLat: debouncedBounds.minLat,
    maxLat: debouncedBounds.maxLat,
    minLng: debouncedBounds.minLng,
    maxLng: debouncedBounds.maxLng,
  });

  // Cache previous road segments for stale-while-revalidate pattern
  type RoadSegment = NonNullable<typeof roadSegments>[number];
  const [cachedSegments, setCachedSegments] = useState<RoadSegment[]>([]);

  // Update cache when new data arrives
  useEffect(() => {
    if (roadSegments) {
      setCachedSegments(roadSegments);
    }
  }, [roadSegments]);

  // Derive display data and loading state
  const displaySegments: RoadSegment[] = roadSegments ?? cachedSegments;
  const isInitialLoad = !roadSegments && cachedSegments.length === 0;
  const isFetching = !roadSegments && cachedSegments.length > 0; // Background fetch in progress

  const handleBoundsChange = useCallback(
    (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
      setViewportBounds(bounds);
    },
    []
  );

  const getColor = (status: string) => {
    switch (status) {
      case 'flooded': return '#ef4444'; // Red-500
      case 'risk': return '#f97316'; // Orange-500
      default: return '#10b981'; // Emerald-500
    }
  };

  // Only show loading on initial load (when no cached data exists)
  if (isInitialLoad) return <div className="h-full w-full flex items-center justify-center bg-dark-800 text-gray-400">Loading Map Data...</div>;

  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      className="h-full w-full z-0"
      style={{ background: '#1a1a1a' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ViewportTracker onBoundsChange={handleBoundsChange} />
      
      {displaySegments.map((segment) => (
        <Polyline
          key={segment._id}
          positions={segment.coordinates as [number, number][]}
          pathOptions={{
            color: getColor(segment.status),
            weight: selectedRoadId === segment._id ? 8 : 5,
            opacity: selectedRoadId === segment._id ? 1 : 0.7,
          }}
          eventHandlers={{
            click: () => onSelectRoad(segment._id),
          }}
        >
          <Popup className="custom-popup">
            <div className="p-2">
              <h3 className="font-bold text-lg">{segment.name}</h3>
              <p className="capitalize text-sm">Status: <span style={{ color: getColor(segment.status) }}>{segment.status}</span></p>
            </div>
          </Popup>
        </Polyline>
      ))}
      
      {/* Non-blocking loading indicator */}
      {isFetching && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-700/50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
          <span className="text-sm text-gray-300">Loading...</span>
        </div>
      )}
    </MapContainer>
  );
}
