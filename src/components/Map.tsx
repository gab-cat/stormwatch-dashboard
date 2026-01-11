import { MapContainer, TileLayer, Polyline, Circle, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { api } from '../../convex/_generated/api';
import { useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Layers, AlertTriangle, ChevronDown, ChevronUp, Droplet, Car, User, Radio, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { useGridCellCache } from '../hooks/useGridCellCache';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  onSelectRoad: (roadId: Id<"roadSegments"> | null) => void;
  selectedRoadId: Id<"roadSegments"> | null;
  showDevices?: boolean;
  onDeviceClick?: (deviceId: Id<"iotDevices"> | null) => void;
  selectedDeviceId?: Id<"iotDevices"> | null;
  hideOverlays?: boolean;
  devices?: NonNullable<ReturnType<typeof useQuery<typeof api.devices.getWithLocations>>>;
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

// Custom device marker icon - Sensor/Antenna icon
const deviceIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="6" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
      <path d="M12 6 L12 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 18 L12 22" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 12 L2 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M18 12 L22 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M8.5 8.5 L5.5 5.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M15.5 15.5 L18.5 18.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M15.5 8.5 L18.5 5.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8.5 15.5 L5.5 18.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const selectedDeviceIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#f59e0b" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="7" fill="#f59e0b" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
      <path d="M12 5 L12 1" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M12 19 L12 23" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M5 12 L1 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M19 12 L23 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M7.5 7.5 L4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M16.5 16.5 L20 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M16.5 7.5 L20 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M7.5 16.5 L4 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

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

// Component to center map on selected device
function MapCenterController({ 
  selectedDeviceId, 
  devices 
}: { 
  selectedDeviceId: Id<"iotDevices"> | null;
  devices?: NonNullable<ReturnType<typeof useQuery<typeof api.devices.getWithLocations>>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedDeviceId && devices && devices.length > 0) {
      const device = devices.find(d => d._id === selectedDeviceId);
      if (device && device.location && device.location.length === 2) {
        map.flyTo([device.location[0], device.location[1]], map.getMaxZoom(), {
          duration: 1.0,
        });
      }
    }
  }, [selectedDeviceId, devices, map]);

  return null;
}

// Device Prediction Overlay Component
const DevicePredictionOverlay = memo(function DevicePredictionOverlay({
  deviceId,
  onClose,
  devices,
  predictions,
}: {
  deviceId: Id<"iotDevices">;
  onClose: () => void;
  devices?: NonNullable<ReturnType<typeof useQuery<typeof api.devices.getWithLocations>>>;
  predictions?: NonNullable<ReturnType<typeof useQuery<typeof api.predictions.getByDevices>>>;
}) {
  const device = useMemo(() => devices?.find(d => d._id === deviceId), [devices, deviceId]);
  const devicePredictions = useMemo(
    () => predictions?.filter(p => p.deviceId === deviceId) || [],
    [predictions, deviceId]
  );
  
  const timeHorizons = ["1h", "2h", "4h", "8h"] as const;
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", bar: "bg-red-500" };
      case "high":
        return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", bar: "bg-orange-500" };
      case "medium":
        return { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", bar: "bg-yellow-500" };
      case "low":
        return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", bar: "bg-emerald-500" };
      default:
        return { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", bar: "bg-gray-500" };
    }
  };

  const getPassability = (height: number): { vehicles: boolean; humans: boolean } => {
    return {
      vehicles: height < 30,
      humans: height < 50,
    };
  };

  if (!device) return null;

  const predictionsByHorizon = useMemo(
    () => timeHorizons.map((horizon) =>
      devicePredictions.find((p) => p.timeHorizon === horizon)
    ),
    [devicePredictions]
  );

  return (
    <Card className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 z-1000 bg-background/50 backdrop-blur-sm shadow-2xl border-border/50 animate-in slide-in-from-bottom-5 duration-300 max-w-6xl mx-auto">
      <CardHeader className="pb-2 pt-3 px-3 md:px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <div className={cn(
              "w-2 h-2 rounded-full mt-1.5 shrink-0",
              device.isAlive ? "bg-emerald-400" : "bg-red-400"
            )} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg mb-0.5">{device.name}</CardTitle>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs py-0">
                  {device.type.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {device.influenceRadius}m
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className={cn(
                  "text-xs font-medium",
                  device.isAlive ? "text-emerald-400" : "text-red-400"
                )}>
                  {device.isAlive ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-7 md:w-7 shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            onClick={onClose}
          >
            <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
        {devicePredictions.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5">
            {predictionsByHorizon.map((prediction, index) => {
              const horizon = timeHorizons[index];
              if (!prediction) {
                return (
                  <Card key={horizon} className="bg-muted/10 border-dashed">
                    <CardContent className="p-2 md:p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{horizon}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">No data</div>
                    </CardContent>
                  </Card>
                );
              }

              const waterLevel = prediction.predictedWaterLevel ?? 0;
              const passability = getPassability(waterLevel);
              const severityColors = getSeverityColor(prediction.severity);

              return (
                <Card key={horizon} className={cn("border-2 py-0", severityColors.border)}>
                  <CardContent className="p-2 md:p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className={cn("w-3.5 h-3.5", severityColors.text)} />
                        <span className={cn("text-xs font-semibold", severityColors.text)}>
                          {horizon}
                        </span>
                      </div>
                      <Badge variant="outline" className={cn("text-xs py-0", severityColors.bg, severityColors.text, severityColors.border)}>
                        {prediction.severity.toUpperCase()}
                      </Badge>
                    </div>


                    {/* Passability Indicators */}
                    {waterLevel > 0 && (
                      <div className="space-y-1 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Car className={cn(
                              "w-3 h-3",
                              passability.vehicles ? "text-emerald-400" : "text-red-400"
                            )} />
                            <span className="text-xs">Vehicles</span>
                          </div>
                          <span className={cn(
                            "text-xs font-medium",
                            passability.vehicles ? "text-emerald-400" : "text-red-400"
                          )}>
                            {passability.vehicles ? "Pass" : "Block"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <User className={cn(
                              "w-3 h-3",
                              passability.humans ? "text-emerald-400" : "text-red-400"
                            )} />
                            <span className="text-xs">Humans</span>
                          </div>
                          <span className={cn(
                            "text-xs font-medium",
                            passability.humans ? "text-emerald-400" : "text-red-400"
                          )}>
                            {passability.humans ? "Pass" : "Block"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Probability */}
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="text-xs text-muted-foreground mb-0.5">Probability</div>
                      <div className={cn("text-sm md:text-base font-bold", severityColors.text)}>
                        {(prediction.floodProbability * 100).toFixed(0)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Droplet className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No prediction data available for this sensor.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default function Map({ 
  onSelectRoad, 
  selectedRoadId, 
  showDevices = false,
  onDeviceClick,
  selectedDeviceId = null,
  hideOverlays = false,
  devices: devicesProp,
}: MapProps) {
  const center: [number, number] = [13.6139, 123.1853]; // Naga City
  const [layersVisible, setLayersVisible] = useState({
    roads: true,
    devices: showDevices,
    deviceRadius: showDevices,
    alerts: true,
  });
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(true);
  
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

  // Use grid-cell cache for efficient incremental loading
  const {
    segments: displaySegments,
    isFetching,
    isInitialLoad,
  } = useGridCellCache({
    viewportBounds: debouncedBounds,
    buffer: 0.2, // 20% buffer for pre-fetching
  });

  // Use devices from prop if provided, otherwise query (for backward compatibility)
  const devicesFromQuery = useQuery(
    api.devices.getWithLocations,
    !devicesProp && (layersVisible.devices || showDevices) ? {} : "skip"
  );
  const devices = devicesProp || devicesFromQuery;
  // Only load predictions for visible devices (much more efficient than loading all)
  const deviceIds = devices?.map(d => d._id) || [];
  const predictions = useQuery(
    api.predictions.getByDevices,
    (layersVisible.devices || showDevices) && deviceIds.length > 0
      ? { deviceIds }
      : "skip"
  );
  const activeAlerts = useQuery(api.alerts.getActive, (layersVisible.devices || showDevices) && layersVisible.alerts ? {} : "skip");

  // Memoize predictions by device ID for efficient lookups
  type Prediction = NonNullable<typeof predictions>[number];
  const predictionsByDevice = useMemo(() => {
    const predictionsMap = new globalThis.Map<Id<"iotDevices">, Prediction[]>();
    if (!predictions) return predictionsMap;
    predictions.forEach((pred) => {
      const existing = predictionsMap.get(pred.deviceId) || [];
      predictionsMap.set(pred.deviceId, [...existing, pred]);
    });
    return predictionsMap;
  }, [predictions]) as globalThis.Map<Id<"iotDevices">, Prediction[]>;

  const handleBoundsChange = useCallback(
    (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
      setViewportBounds(bounds);
    },
    []
  );

  /**
   * Calculate passability from flood height (in cm)
   * - Vehicles impassable: ≥ 30cm
   * - Humans impassable: ≥ 50cm
   */
  const getPassability = (height: number): { vehicles: boolean; humans: boolean } => {
    return {
      vehicles: height < 30,
      humans: height < 50,
    };
  };

  const getColor = (status: string) => {
    switch (status) {
      case 'flooded': return '#ef4444'; // Red-500
      case 'risk': return '#f97316'; // Orange-500
      default: return '#10b981'; // Emerald-500
    }
  };


  // Get severity color for alerts
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
      case 'danger': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
      case 'warning': return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' };
      case 'info': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
    }
  };


  // Never block the map - always render it to keep it interactive
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
      <MapCenterController selectedDeviceId={selectedDeviceId} devices={devices} />
      
      {/* Device Influence Radius Circles */}
      {(layersVisible.deviceRadius || showDevices) && devices?.map((device) => {
        const devicePredictions = predictionsByDevice.get(device._id) || [];
        const highestPrediction = devicePredictions.length > 0 
          ? devicePredictions.reduce((max: Prediction, p: Prediction) => {
              const severityOrder: Record<"low" | "medium" | "high" | "critical", number> = { low: 1, medium: 2, high: 3, critical: 4 };
              return severityOrder[p.severity] > severityOrder[max.severity] ? p : max;
            }, devicePredictions[0])
          : null;
        
        const severityColors: Record<"low" | "medium" | "high" | "critical", { fill: string; stroke: string; opacity: number }> = {
          critical: { fill: '#dc2626', stroke: '#ffffff', opacity: 0.2 },
          high: { fill: '#ea580c', stroke: '#ffffff', opacity: 0.15 },
          medium: { fill: '#ca8a04', stroke: '#ffffff', opacity: 0.1 },
          low: { fill: '#16a34a', stroke: '#ffffff', opacity: 0.1 },
        };
        
        const colors = highestPrediction 
          ? severityColors[highestPrediction.severity] 
          : { fill: '#6b7280', stroke: '#ffffff', opacity: 0.1 };
        
        // Ensure influenceRadius is a valid number (default to 500m for existing devices)
        const radiusMeters = (typeof device.influenceRadius === 'number' && !isNaN(device.influenceRadius))
          ? device.influenceRadius 
          : 500;
        
        // Only render circle if we have valid location and radius
        if (!device.location || device.location.length !== 2 || typeof radiusMeters !== 'number' || isNaN(radiusMeters)) {
          return null;
        }
        
        return (
          <Circle
            key={`device-radius-${device._id}`}
            center={device.location as [number, number]}
            radius={radiusMeters}
            pathOptions={{
              fillColor: colors.fill,
              color: colors.stroke,
              fillOpacity: colors.opacity,
              weight: selectedDeviceId === device._id ? 3 : 2,
              opacity: selectedDeviceId === device._id ? 0.8 : 0.5,
            }}
          />
        );
      })}
      
      {/* Road Segments */}
      {layersVisible.roads && displaySegments.map((segment) => (
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
            <div className="p-2 md:p-3">
              <h3 className="font-bold text-base md:text-lg">{segment.name}</h3>
              <p className="capitalize text-xs md:text-sm">Status: <span style={{ color: getColor(segment.status) }}>{segment.status}</span></p>
              {segment.updatedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(segment.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              )}
            </div>
          </Popup>
        </Polyline>
      ))}

      {/* Device Markers */}
      {(layersVisible.devices || showDevices) && devices?.map((device) => {
        const devicePredictions = predictionsByDevice.get(device._id) || [];
        const highestPrediction = devicePredictions.length > 0 
          ? devicePredictions.reduce((max: Prediction, p: Prediction) => {
              const severityOrder: Record<"low" | "medium" | "high" | "critical", number> = { low: 1, medium: 2, high: 3, critical: 4 };
              return severityOrder[p.severity] > severityOrder[max.severity] ? p : max;
            }, devicePredictions[0])
          : null;
        
        return (
          <Marker
            key={device._id}
            position={device.location as [number, number]}
            icon={selectedDeviceId === device._id ? selectedDeviceIcon : deviceIcon}
            eventHandlers={{
              click: () => onDeviceClick?.(device._id),
            }}
          >
            <Popup className="device-popup">
              <div className="p-2 md:p-3 min-w-[200px] md:min-w-[240px] max-w-[calc(100vw-2rem)] md:max-w-none">
                {/* Header */}
                <div className="flex items-start gap-2 mb-2 md:mb-3">
                  <Radio className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base leading-tight">{device.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {device.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mb-2 md:mb-3 pb-2 md:pb-3 border-b border-border/50">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    device.isAlive ? "bg-emerald-400" : "bg-red-400"
                  )} />
                  <span className="text-xs font-medium">
                    {device.isAlive ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {(device.influenceRadius && !isNaN(device.influenceRadius) ? device.influenceRadius : 500)}m radius
                  </span>
                </div>

                {/* Prediction */}
                {highestPrediction && highestPrediction.predictedWaterLevel !== undefined ? (
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Latest Prediction</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          highestPrediction.severity === 'critical' && 'bg-red-500/10 text-red-400 border-red-500/20',
                          highestPrediction.severity === 'high' && 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          highestPrediction.severity === 'medium' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                          highestPrediction.severity === 'low' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        )}
                      >
                        {highestPrediction.severity.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Passability */}
                    {(() => {
                      const passability = getPassability(highestPrediction.predictedWaterLevel);
                      return (
                        <div className="pt-2 border-t border-border/50 space-y-2">
                          <p className="text-xs text-muted-foreground font-medium mb-1.5">Road Passability</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Car className={cn(
                                  "w-3.5 h-3.5",
                                  passability.vehicles ? "text-emerald-400" : "text-red-400"
                                )} />
                                <span className="text-xs">Vehicles</span>
                              </div>
                              <span className={cn(
                                "text-xs font-medium",
                                passability.vehicles ? "text-emerald-400" : "text-red-400"
                              )}>
                                {passability.vehicles ? "Passable" : "Impassable"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <User className={cn(
                                  "w-3.5 h-3.5",
                                  passability.humans ? "text-emerald-400" : "text-red-400"
                                )} />
                                <span className="text-xs">Humans</span>
                              </div>
                              <span className={cn(
                                "text-xs font-medium",
                                passability.humans ? "text-emerald-400" : "text-red-400"
                              )}>
                                {passability.humans ? "Passable" : "Impassable"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-2">
                    No prediction data available
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Alerts Overlay Panel */}
      {!hideOverlays && layersVisible.alerts && (layersVisible.devices || showDevices) && activeAlerts && activeAlerts.length > 0 && (
        <Card className={cn(
          "absolute top-2 left-2 right-2 py-0 md:top-4 md:left-4 md:right-auto z-1000 bg-background/90 backdrop-blur-sm shadow-lg transition-all",
          showAlertsPanel ? "md:w-80" : "md:min-w-[220px]"
        )}>
          <CardHeader className="pb-2 px-3 md:px-4 pt-3 md:pt-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="whitespace-nowrap">Alerts ({activeAlerts.length})</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-7 md:w-7 min-h-[44px] min-w-[44px] md:min-h-[32px] md:min-w-[32px] shrink-0"
                onClick={() => setShowAlertsPanel(!showAlertsPanel)}
              >
                {showAlertsPanel ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showAlertsPanel && (
            <CardContent className="space-y-2 max-h-64 overflow-y-auto px-3 md:px-6 pb-3 md:pb-6">
              {activeAlerts.map((alert) => {
                const severityColors = getAlertSeverityColor(alert.severity);
                return (
                  <div
                    key={alert._id}
                    className={cn(
                      "p-3 rounded-lg border",
                      severityColors.bg,
                      severityColors.border
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", severityColors.text)} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm mb-1", severityColors.text)}>
                          {alert.title}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", severityColors.bg, severityColors.text, severityColors.border)}
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.affectedDeviceIds.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {alert.affectedDeviceIds.length} device{alert.affectedDeviceIds.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}

      {/* Device Prediction Overlay */}
      {!hideOverlays && selectedDeviceId && (
        <DevicePredictionOverlay
          deviceId={selectedDeviceId}
          onClose={() => onDeviceClick?.(null)}
          devices={devices}
          predictions={predictions}
        />
      )}

      {/* Non-blocking loading indicator - shown for initial load or background fetches */}
      {(isInitialLoad || isFetching) && (
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-1000 bg-gray-900/90 backdrop-blur-sm rounded-lg px-2 md:px-3 py-2 shadow-lg border border-gray-700/50 flex items-center gap-2 pointer-events-none">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
          <span className="text-xs md:text-sm text-gray-300">{isInitialLoad ? 'Loading map data...' : 'Updating...'}</span>
        </div>
      )}

      {/* Layer Control Toggle */}
      {showDevices && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 md:top-4 md:right-4 z-1000 bg-background/90 backdrop-blur-sm shadow-lg min-h-[44px] min-w-[44px]"
            onClick={() => setShowLayerControl(!showLayerControl)}
          >
            <Layers className="w-5 h-5" />
          </Button>

          {showLayerControl && (
            <Card className="absolute top-14 right-2 md:top-16 md:right-4 z-1000 bg-background/90 backdrop-blur-sm shadow-lg max-w-[calc(100vw-1rem)] md:max-w-none">
              <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
                <h3 className="font-semibold text-xs md:text-sm mb-2">Map Layers</h3>
                <div className="flex items-center gap-2 min-h-[44px]">
                  <input
                    type="checkbox"
                    id="layer-roads"
                    checked={layersVisible.roads}
                    onChange={(e) => setLayersVisible({ ...layersVisible, roads: e.target.checked })}
                    className="rounded w-4 h-4 md:w-auto md:h-auto"
                  />
                  <Label htmlFor="layer-roads" className="text-xs md:text-sm cursor-pointer">
                    Road Segments
                  </Label>
                </div>
                {showDevices && (
                  <div className="flex items-center gap-2 min-h-[44px]">
                    <input
                      type="checkbox"
                      id="layer-devices"
                      checked={layersVisible.devices}
                      onChange={(e) => setLayersVisible({ ...layersVisible, devices: e.target.checked })}
                      className="rounded w-4 h-4 md:w-auto md:h-auto"
                    />
                    <Label htmlFor="layer-devices" className="text-xs md:text-sm cursor-pointer">
                      IoT Devices
                    </Label>
                  </div>
                )}
                <div className="flex items-center gap-2 min-h-[44px]">
                  <input
                    type="checkbox"
                    id="layer-device-radius"
                    checked={layersVisible.deviceRadius}
                    onChange={(e) => setLayersVisible({ ...layersVisible, deviceRadius: e.target.checked })}
                    className="rounded w-4 h-4 md:w-auto md:h-auto"
                  />
                  <Label htmlFor="layer-device-radius" className="text-xs md:text-sm cursor-pointer">
                    Device Influence Radius
                  </Label>
                </div>
                <div className="flex items-center gap-2 min-h-[44px]">
                  <input
                    type="checkbox"
                    id="layer-alerts"
                    checked={layersVisible.alerts}
                    onChange={(e) => setLayersVisible({ ...layersVisible, alerts: e.target.checked })}
                    className="rounded w-4 h-4 md:w-auto md:h-auto"
                  />
                  <Label htmlFor="layer-alerts" className="text-xs md:text-sm cursor-pointer">
                    Alerts & Warnings
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </MapContainer>
  );
}
