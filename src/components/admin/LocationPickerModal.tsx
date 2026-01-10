import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icon
const locationIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LocationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation: [number, number];
  onLocationSelect: (location: [number, number]) => void;
}

function MapClickHandler({
  onLocationClick,
}: {
  onLocationClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerModal({
  open,
  onOpenChange,
  initialLocation,
  onLocationSelect,
}: LocationPickerModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>(initialLocation);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
  }, []);

  const handleConfirm = () => {
    onLocationSelect(selectedLocation);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedLocation(initialLocation);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Select Device Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Click anywhere on the map to set the device location.
          </div>

          {/* Map Container */}
          <div className="h-[500px] w-full rounded-lg overflow-hidden border border-border">
            <MapContainer
              center={selectedLocation}
              zoom={14}
              className="h-full w-full"
              style={{ background: "#1a1a1a" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <MapClickHandler onLocationClick={handleMapClick} />
              <Marker position={selectedLocation} icon={locationIcon} />
            </MapContainer>
          </div>

          {/* Coordinates Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm">
                {selectedLocation[0].toFixed(6)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm">
                {selectedLocation[1].toFixed(6)}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
