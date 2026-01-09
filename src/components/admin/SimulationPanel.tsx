import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Activity,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

type ReadingType =
  | "water_level"
  | "rainfall"
  | "flow_rate"
  | "temperature"
  | "humidity";

const READING_TYPES: { value: ReadingType; label: string }[] = [
  { value: "water_level", label: "Water Level" },
  { value: "rainfall", label: "Rainfall" },
  { value: "flow_rate", label: "Flow Rate" },
  { value: "temperature", label: "Temperature" },
  { value: "humidity", label: "Humidity" },
];

const UNIT_PRESETS: Record<ReadingType, string[]> = {
  water_level: ["cm", "m", "mm"],
  rainfall: ["mm", "cm", "in"],
  flow_rate: ["m/s", "m³/s", "L/s"],
  temperature: ["°C", "°F", "K"],
  humidity: ["%"],
};

export default function SimulationPanel() {
  const devices = useQuery(api.devices.getAll);
  const createReading = useMutation(api.readings.create);

  const [selectedDeviceId, setSelectedDeviceId] = useState<
    Id<"iotDevices"> | null
  >(null);
  const [formData, setFormData] = useState({
    readingType: "water_level" as ReadingType,
    value: "",
    unit: "cm",
    metadata: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const recentReadings = useQuery(
    api.readings.getByDevice,
    selectedDeviceId ? { deviceId: selectedDeviceId, limit: 10 } : "skip"
  );

  const selectedDevice = devices?.find((d) => d._id === selectedDeviceId);

  const handleDeviceChange = (deviceId: Id<"iotDevices">) => {
    setSelectedDeviceId(deviceId);
    const device = devices?.find((d) => d._id === deviceId);
    if (device) {
      // Set default reading type based on device type
      let defaultType: ReadingType = "water_level";
      if (device.type === "rain_gauge") defaultType = "rainfall";
      else if (device.type === "flow_meter") defaultType = "flow_rate";
      else if (device.capabilities.includes("temperature")) defaultType = "temperature";

      setFormData({
        readingType: defaultType,
        value: "",
        unit: UNIT_PRESETS[defaultType][0],
        metadata: "",
      });
    }
    setSubmitStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId || !formData.value) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const value = parseFloat(formData.value);
      if (isNaN(value)) {
        throw new Error("Value must be a valid number");
      }

      await createReading({
        deviceId: selectedDeviceId,
        readingType: formData.readingType,
        value,
        unit: formData.unit,
        metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined,
      });

      setSubmitStatus({
        type: "success",
        message: "Reading submitted successfully!",
      });

      // Reset form but keep device selected
      setFormData({
        ...formData,
        value: "",
        metadata: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to submit reading",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreset = (preset: { value: number; unit: string }) => {
    setFormData({
      ...formData,
      value: preset.value.toString(),
      unit: preset.unit,
    });
  };

  const getQuickPresets = (): { label: string; value: number; unit: string }[] => {
    if (!selectedDevice) return [];
    const type = formData.readingType;

    switch (type) {
      case "water_level":
        return [
          { label: "Normal (10cm)", value: 10, unit: "cm" },
          { label: "Warning (50cm)", value: 50, unit: "cm" },
          { label: "Critical (100cm)", value: 100, unit: "cm" },
        ];
      case "rainfall":
        return [
          { label: "Light (5mm)", value: 5, unit: "mm" },
          { label: "Moderate (20mm)", value: 20, unit: "mm" },
          { label: "Heavy (50mm)", value: 50, unit: "mm" },
        ];
      case "flow_rate":
        return [
          { label: "Low (0.5 m/s)", value: 0.5, unit: "m/s" },
          { label: "Medium (2.0 m/s)", value: 2.0, unit: "m/s" },
          { label: "High (5.0 m/s)", value: 5.0, unit: "m/s" },
        ];
      case "temperature":
        return [
          { label: "Cool (20°C)", value: 20, unit: "°C" },
          { label: "Normal (25°C)", value: 25, unit: "°C" },
          { label: "Warm (30°C)", value: 30, unit: "°C" },
        ];
      case "humidity":
        return [
          { label: "Low (40%)", value: 40, unit: "%" },
          { label: "Normal (60%)", value: 60, unit: "%" },
          { label: "High (80%)", value: 80, unit: "%" },
        ];
      default:
        return [];
    }
  };

  if (!devices) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sensor Simulation</h1>
          <p className="text-gray-400">
            Test sensor readings by simulating data from IoT devices
          </p>
        </div>

        {devices.length === 0 ? (
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Devices Found</h2>
            <p className="text-gray-400 mb-4">
              Create a device first in the Device Manager to start simulating readings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulation Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Device Selector */}
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Select Device
                </h2>
                <select
                  value={selectedDeviceId || ""}
                  onChange={(e) =>
                    handleDeviceChange(e.target.value as Id<"iotDevices">)
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="">Choose a device...</option>
                  {devices.map((device) => (
                    <option key={device._id} value={device._id}>
                      {device.name} ({device.type.replace("_", " ")}) -{" "}
                      {device.isAlive ? "Online" : "Offline"}
                    </option>
                  ))}
                </select>

                {selectedDevice && (
                  <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{selectedDevice.name}</span>
                      <div className="flex items-center gap-2">
                        {selectedDevice.isAlive ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Online</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">Offline</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Type: {selectedDevice.type.replace("_", " ")}</div>
                      <div>Owner: {selectedDevice.owner}</div>
                      <div>
                        Capabilities: {selectedDevice.capabilities.join(", ") || "None"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reading Form */}
              {selectedDeviceId && (
                <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit Reading
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Reading Type
                      </label>
                      <select
                        value={formData.readingType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            readingType: e.target.value as ReadingType,
                            unit: UNIT_PRESETS[e.target.value as ReadingType][0],
                          })
                        }
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                      >
                        {READING_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Value
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.value}
                          onChange={(e) =>
                            setFormData({ ...formData, value: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                          placeholder="0.0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Unit
                        </label>
                        <select
                          value={formData.unit}
                          onChange={(e) =>
                            setFormData({ ...formData, unit: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                        >
                          {UNIT_PRESETS[formData.readingType].map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    {getQuickPresets().length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Quick Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {getQuickPresets().map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleQuickPreset(preset)}
                              className="px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Metadata (Optional JSON)
                      </label>
                      <textarea
                        value={formData.metadata}
                        onChange={(e) =>
                          setFormData({ ...formData, metadata: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white font-mono text-sm"
                        placeholder='{"battery": 85, "signal": -65}'
                        rows={3}
                      />
                    </div>

                    {submitStatus && (
                      <div
                        className={cn(
                          "p-4 rounded-lg flex items-center gap-2",
                          submitStatus.type === "success"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}
                      >
                        {submitStatus.type === "success" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{submitStatus.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.value}
                      className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Submit Reading
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Recent Readings */}
            <div className="lg:col-span-1">
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Readings
                </h2>

                {!selectedDeviceId ? (
                  <p className="text-gray-400 text-sm">
                    Select a device to view recent readings
                  </p>
                ) : recentReadings === undefined ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : recentReadings.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No readings yet for this device
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {recentReadings.map((reading) => (
                      <div
                        key={reading._id}
                        className="p-3 bg-dark-700 rounded-lg border border-dark-600"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {reading.readingType.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(reading.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-lg font-bold">
                          {reading.value} {reading.unit}
                        </div>
                        {reading.metadata && (
                          <div className="text-xs text-gray-400 mt-1 font-mono">
                            {JSON.stringify(reading.metadata)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
