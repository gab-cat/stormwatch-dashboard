import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Clock, AlertTriangle, Droplet } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

function ZonePredictionCard({ zoneId }: { zoneId: Id<"floodZones"> }) {
  const zone = useQuery(api.zones.getById, { id: zoneId });
  const predictions = useQuery(api.predictions.getLatestByZone, { zoneId });

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

  if (!zone) return null;

  if (!predictions || predictions.length === 0) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h3 className="font-bold text-lg mb-2">{zone.name}</h3>
        <p className="text-gray-400 text-sm">No predictions available yet.</p>
      </div>
    );
  }

  // Group predictions by time horizon
  const predictionsByHorizon = timeHorizons.map((horizon) =>
    predictions.find((p) => p.timeHorizon === horizon)
  );

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
      <h3 className="font-bold text-lg mb-2">{zone.name}</h3>
      {zone.description && (
        <p className="text-sm text-gray-400 mb-4">{zone.description}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {predictionsByHorizon.map((prediction, index) => {
          const horizon = timeHorizons[index];
          if (!prediction) {
            return (
              <div
                key={horizon}
                className="bg-dark-700/50 border border-dark-600 rounded-lg p-4 text-center"
              >
                <Clock className="w-5 h-5 text-gray-500 mx-auto mb-2" />
                <div className="text-xs font-medium text-gray-500 mb-1">
                  {horizon}
                </div>
                <div className="text-sm text-gray-600">No data</div>
              </div>
            );
          }

          return (
            <div
              key={horizon}
              className={cn(
                "border rounded-lg p-4",
                getSeverityColor(prediction.severity)
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">{horizon}</span>
              </div>
              <div className="mb-2">
                <div className="text-2xl font-bold">
                  {(prediction.floodProbability * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">Flood Risk</div>
              </div>
              {prediction.predictedWaterLevel && (
                <div className="flex items-center gap-1 text-xs">
                  <Droplet className="w-3 h-3" />
                  <span>{prediction.predictedWaterLevel}cm</span>
                </div>
              )}
              <div
                className={cn(
                  "mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  getSeverityColor(prediction.severity)
                )}
              >
                {prediction.severity.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PredictionCards() {
  const zones = useQuery(api.zones.getAll);
  const activeAlerts = useQuery(api.alerts.getActive);

  if (!zones || zones.length === 0) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <p className="text-gray-400 text-center">No flood zones configured yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Alerts Banner */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
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
        </div>
      )}

      {/* Prediction Cards for Each Zone */}
      {zones.map((zone) => (
        <ZonePredictionCard key={zone._id} zoneId={zone._id} />
      ))}
    </div>
  );
}
