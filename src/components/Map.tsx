import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import { api } from '../../convex/_generated/api';
import { useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  onSelectRoad: (roadId: Id<"roads"> | null) => void;
  selectedRoadId: Id<"roads"> | null;
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

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function Map({ onSelectRoad, selectedRoadId }: MapProps) {
  const roads = useQuery(api.roads.get);
  const center: [number, number] = [13.6139, 123.1853]; // Naga City

  const getColor = (status: string) => {
    switch (status) {
      case 'flooded': return '#ef4444'; // Red-500
      case 'risk': return '#f97316'; // Orange-500
      default: return '#10b981'; // Emerald-500
    }
  };

  if (!roads) return <div className="h-full w-full flex items-center justify-center bg-dark-800 text-gray-400">Loading Map Data...</div>;

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
      <MapController center={center} />
      
      {roads.map((road) => (
        <Polyline
          key={road._id}
          positions={road.coordinates as [number, number][]}
          pathOptions={{
            color: getColor(road.status),
            weight: selectedRoadId === road._id ? 8 : 5,
            opacity: selectedRoadId === road._id ? 1 : 0.7,
          }}
          eventHandlers={{
            click: () => onSelectRoad(road._id),
          }}
        >
          <Popup className="custom-popup">
            <div className="p-2">
              <h3 className="font-bold text-lg">{road.name}</h3>
              <p className="capitalize text-sm">Status: <span style={{ color: getColor(road.status) }}>{road.status}</span></p>
            </div>
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
}
