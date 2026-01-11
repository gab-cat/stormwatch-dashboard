import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Clock, AlertTriangle, Car, User } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

/**
 * Calculate passability from flood height (in cm)
 * - Vehicles impassable: ≥ 30cm
 * - Humans impassable: ≥ 50cm
 */
function getPassability(height: number): {
  vehicles: boolean;
  humans: boolean;
} {
  return {
    vehicles: height < 30,
    humans: height < 50,
  };
}

function DevicePredictionCard({ 
  deviceId, 
  onDeviceClick,
  isSelected 
}: { 
  deviceId: Id<"iotDevices">;
  onDeviceClick?: (deviceId: Id<"iotDevices">) => void;
  isSelected?: boolean;
}) {
  const device = useQuery(api.devices.getById, { id: deviceId });
  const predictions = useQuery(api.predictions.getLatestByDevice, { deviceId });

  const timeHorizons = ["1h", "2h", "4h", "8h"] as const;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  if (!device) return null;

  if (!predictions || predictions.length === 0) {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
          isSelected && "border-primary border-2 shadow-lg"
        )}
        onClick={() => onDeviceClick?.(deviceId)}
      >
        <CardHeader>
          <CardTitle className="text-lg">{device.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No predictions available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Group predictions by time horizon
  const predictionsByHorizon = timeHorizons.map((horizon) =>
    predictions.find((p) => p.timeHorizon === horizon)
  );

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
        isSelected && "border-primary border-2 shadow-lg"
      )}
      onClick={() => onDeviceClick?.(deviceId)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{device.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {device.type.replace('_', ' ')} • {device.influenceRadius}m radius
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {predictionsByHorizon.map((prediction, index) => {
            const horizon = timeHorizons[index];
            if (!prediction) {
              return (
                <Card key={horizon} className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {horizon}
                    </div>
                    <div className="text-sm text-muted-foreground">No data</div>
                  </CardContent>
                </Card>
              );
            }

            const waterLevel = prediction.predictedWaterLevel ?? 0;
            const passability = getPassability(waterLevel);

            return (
              <Card
                key={horizon}
                className={getSeverityColor(prediction.severity)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">{horizon}</span>
                  </div>
                  {waterLevel > 0 && (
                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Car className={cn(
                          "w-3 h-3",
                          passability.vehicles ? "text-emerald-400" : "text-red-400"
                        )} />
                        <span className={cn(
                          passability.vehicles ? "text-emerald-400" : "text-red-400"
                        )}>
                          {passability.vehicles ? "Passable" : "Impassable"}
                        </span>
                        <span className="text-muted-foreground">(vehicles)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <User className={cn(
                          "w-3 h-3",
                          passability.humans ? "text-emerald-400" : "text-red-400"
                        )} />
                        <span className={cn(
                          passability.humans ? "text-emerald-400" : "text-red-400"
                        )}>
                          {passability.humans ? "Passable" : "Impassable"}
                        </span>
                        <span className="text-muted-foreground">(humans)</span>
                      </div>
                    </div>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-2 w-full justify-center",
                      getSeverityColor(prediction.severity)
                    )}
                  >
                    {prediction.severity.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PredictionCards({ 
  onDeviceClick,
  selectedDeviceId 
}: { 
  onDeviceClick?: (deviceId: Id<"iotDevices">) => void;
  selectedDeviceId?: Id<"iotDevices"> | null;
}) {
  const devices = useQuery(api.devices.getAll);
  const activeAlerts = useQuery(api.alerts.getActive);

  if (!devices || devices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No devices configured yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Alerts Banner */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-400 mb-2">Active Flood Alerts</h3>
                <div className="space-y-2">
                  {activeAlerts.map((alert) => (
                    <div key={alert._id}>
                      <p className="font-medium text-red-300">{alert.title}</p>
                      <p className="text-sm text-red-400/80">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Cards for Each Device */}
      {devices.map((device) => (
        <DevicePredictionCard 
          key={device._id} 
          deviceId={device._id}
          onDeviceClick={onDeviceClick}
          isSelected={selectedDeviceId === device._id}
        />
      ))}
    </div>
  );
}
