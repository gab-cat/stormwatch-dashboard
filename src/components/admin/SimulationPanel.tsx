import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Play,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Activity,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import Map from "../Map";

type Scenario = "normal" | "lightRain" | "heavyStorm" | "floodEvent";

const SCENARIOS = {
  normal: {
    name: "Normal Day",
    description: "Typical weather conditions with low water levels",
    icon: "☀️",
    color: "text-green-400",
  },
  lightRain: {
    name: "Light Rain",
    description: "Light rainfall with slightly elevated water levels",
    icon: "🌧️",
    color: "text-yellow-400",
  },
  heavyStorm: {
    name: "Heavy Storm",
    description: "Heavy rainfall with high flood risk",
    icon: "⛈️",
    color: "text-orange-400",
  },
  floodEvent: {
    name: "Flood Event",
    description: "Critical flooding conditions",
    icon: "🌊",
    color: "text-red-400",
  },
};

type SimulationStep = {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "running" | "completed" | "error";
};

type ActivityLog = {
  id: string;
  timestamp: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
};

export default function SimulationPanel() {
  const devices = useQuery(api.devices.getAll);
  const runScenario = useMutation(api.simulation.runScenario);
  const resetSimulation = useMutation(api.simulation.resetSimulation);

  const [selectedScenario, setSelectedScenario] = useState<Scenario>("lightRain");
  const [selectedDeviceId, setSelectedDeviceId] = useState<Id<"iotDevices"> | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const [steps, setSteps] = useState<SimulationStep[]>([
    {
      id: 1,
      name: "Select Device",
      description: "Choose an IoT device to simulate",
      icon: <MapPin className="w-5 h-5" />,
      status: "pending",
    },
    {
      id: 2,
      name: "Generate Readings",
      description: "Create sensor readings based on scenario",
      icon: <Activity className="w-5 h-5" />,
      status: "pending",
    },
    {
      id: 3,
      name: "Generate Predictions",
      description: "Create flood predictions for device",
      icon: <TrendingUp className="w-5 h-5" />,
      status: "pending",
    },
    {
      id: 4,
      name: "Update Roads",
      description: "Update road statuses within device influence radius",
      icon: <Zap className="w-5 h-5" />,
      status: "pending",
    },
    {
      id: 5,
      name: "Complete",
      description: "Simulation finished successfully",
      icon: <CheckCircle className="w-5 h-5" />,
      status: "pending",
    },
  ]);

  const addLog = (message: string, type: ActivityLog["type"] = "info") => {
    const log: ActivityLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      message,
      type,
    };
    setActivityLog((prev) => [log, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const updateStepStatus = (stepId: number, status: SimulationStep["status"]) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const resetSteps = () => {
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" }))
    );
    setCurrentStep(0);
    setSimulationResult(null);
  };

  const executeStep = async (stepId: number) => {
    updateStepStatus(stepId, "running");
    setCurrentStep(stepId);

    try {
      switch (stepId) {
        case 1:
          // Step 1: Device selection
          if (!selectedDeviceId) {
            throw new Error("Please select a device");
          }
          const device = devices?.find((d) => d._id === selectedDeviceId);
          addLog(`✓ Selected device: ${device?.name}`, "success");
          updateStepStatus(1, "completed");
          break;

        case 2:
          // Step 2: Generate readings
          addLog(`Generating sensor readings for ${SCENARIOS[selectedScenario].name}...`, "info");
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
          addLog(`✓ Generated 5 water level readings`, "success");
          updateStepStatus(2, "completed");
          break;

        case 3:
          // Step 3: Generate predictions
          addLog(`Generating flood predictions (1h, 2h, 4h, 8h)...`, "info");
          await new Promise((resolve) => setTimeout(resolve, 1200));
          addLog(`✓ Created 4 predictions with ${SCENARIOS[selectedScenario].name} severity`, "success");
          updateStepStatus(3, "completed");
          break;

        case 4:
          // Step 4: Update roads - This is where we actually run the simulation
          addLog(`Running full simulation scenario...`, "info");
          
          if (!selectedDeviceId) {
            throw new Error("No device selected");
          }

          const result = await runScenario({
            deviceId: selectedDeviceId,
            scenario: selectedScenario,
          });

          setSimulationResult(result);
          
          const roadsStatus = "status" in result.steps.roads ? result.steps.roads.status : "unknown";
          addLog(
            `✓ Updated ${result.steps.roads.updated} road segments${"status" in result.steps.roads ? ` to ${roadsStatus} status` : ""}`,
            "success"
          );
          updateStepStatus(4, "completed");
          break;

        case 5:
          // Step 5: Complete
          addLog(`🎉 Simulation completed successfully!`, "success");
          updateStepStatus(5, "completed");
          setIsAutoPlaying(false);
          break;

        default:
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog(`✗ Error: ${message}`, "error");
      updateStepStatus(stepId, "error");
      setIsAutoPlaying(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length) {
      await executeStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRunAll = async () => {
    if (!selectedDeviceId) {
      addLog("Please select a device first", "error");
      return;
    }

    setIsAutoPlaying(true);
    resetSteps();
    addLog(`Starting ${SCENARIOS[selectedScenario].name} simulation...`, "info");

    // Execute all steps sequentially
    for (let i = 1; i <= steps.length; i++) {
      if (!isAutoPlaying) break; // Allow stopping
      await executeStep(i);
      if (i < steps.length) {
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Delay between steps
      }
    }
  };

  const handleReset = async () => {
    setIsAutoPlaying(false);
    resetSteps();
    addLog("Simulation reset", "info");
    
    if (selectedDeviceId) {
      try {
        await resetSimulation({ deviceId: selectedDeviceId });
        addLog("Cleared simulated data", "success");
      } catch (error) {
        addLog("Failed to clear simulated data", "warning");
      }
    }
  };

  const selectedDevice = devices?.find((d) => d._id === selectedDeviceId);

  if (!devices) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="h-full p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="text-xl mb-2">No Devices Found</CardTitle>
              <p className="text-muted-foreground mb-4">
                Create a device first in the Device Manager to start simulating.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">End-to-End Flood Simulation</h1>
          <p className="text-gray-400">
            Simulate complete data flow from IoT sensors through predictions to map visualization
          </p>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Configuration & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Scenario Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Select Scenario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedScenario}
                  onValueChange={(value) => setSelectedScenario(value as Scenario)}
                  disabled={isAutoPlaying}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SCENARIOS).map(([key, scenario]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{scenario.icon}</span>
                          <span>{scenario.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  {SCENARIOS[selectedScenario].description}
                </div>
              </CardContent>
            </Card>

              {/* Device Selector */}
              <Card>
                <CardHeader>
                <CardTitle className="text-lg">2. Select Device</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedDeviceId || ""}
                  onValueChange={(value) => setSelectedDeviceId(value as Id<"iotDevices">)}
                  disabled={isAutoPlaying}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device._id} value={device._id}>
                        {device.name} ({device.type.replace("_", " ")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDevice && (
                    <Card className="bg-muted">
                    <CardContent className="p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                          <span className="font-medium">{selectedDevice.name}</span>
                        <Badge variant="outline" className={selectedDevice.isAlive ? "text-green-400" : "text-red-400"}>
                          {selectedDevice.isAlive ? "Online" : "Offline"}
                        </Badge>
                          </div>
                      <div className="text-muted-foreground">
                        Type: {selectedDevice.type.replace("_", " ")}
                        </div>
                      <div className="text-muted-foreground text-xs">
                        Location: {selectedDevice.location[0].toFixed(4)}, {selectedDevice.location[1].toFixed(4)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

            {/* Control Buttons */}
                <Card>
                  <CardHeader>
                <CardTitle className="text-lg">3. Run Simulation</CardTitle>
                  </CardHeader>
              <CardContent className="space-y-3">
                              <Button
                  onClick={handleRunAll}
                  disabled={!selectedDeviceId || isAutoPlaying}
                        className="w-full"
                  size="lg"
                      >
                  {isAutoPlaying ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                      Run All Steps
                          </>
                        )}
                      </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || isAutoPlaying}
                    variant="outline"
                    size="sm"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentStep >= steps.length || isAutoPlaying}
                    variant="outline"
                    size="sm"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={isAutoPlaying}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result Summary */}
            {simulationResult && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-lg text-green-400">Simulation Complete</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scenario:</span>
                    <span className="font-medium">{simulationResult.scenarioName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device:</span>
                    <span className="font-medium">{simulationResult.deviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Readings:</span>
                    <span className="font-medium">{simulationResult.steps.readings.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Predictions:</span>
                    <span className="font-medium">{simulationResult.steps.predictions.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roads Updated:</span>
                    <span className="font-medium">{simulationResult.steps.roads.updated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{simulationResult.duration}ms</span>
                  </div>
                  </CardContent>
                </Card>
              )}
            </div>

          {/* Right Column: Steps & Activity Log */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Simulation Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-all",
                        step.status === "completed" && "bg-green-500/10 border-green-500/20",
                        step.status === "running" && "bg-blue-500/10 border-blue-500/20 animate-pulse",
                        step.status === "error" && "bg-red-500/10 border-red-500/20",
                        step.status === "pending" && "bg-muted/50 border-border",
                        currentStep === step.id && "ring-2 ring-primary"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          step.status === "completed" && "bg-green-500/20 text-green-400",
                          step.status === "running" && "bg-blue-500/20 text-blue-400",
                          step.status === "error" && "bg-red-500/20 text-red-400",
                          step.status === "pending" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : step.status === "running" ? (
                          <div className="animate-spin">{step.icon}</div>
                        ) : step.status === "error" ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Step {step.id}: {step.name}</span>
                          {step.status === "completed" && (
                            <Badge variant="outline" className="text-green-400 border-green-500/20">
                              Done
                            </Badge>
                          )}
                          {step.status === "running" && (
                            <Badge variant="outline" className="text-blue-400 border-blue-500/20">
                              Running
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                  Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activityLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No activity yet. Run a simulation to see logs.
                    </p>
                  ) : (
                    activityLog.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg text-sm",
                          log.type === "success" && "bg-green-500/10 text-green-400",
                          log.type === "error" && "bg-red-500/10 text-red-400",
                          log.type === "warning" && "bg-yellow-500/10 text-yellow-400",
                          log.type === "info" && "bg-blue-500/10 text-blue-400"
                        )}
                      >
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                        <span className="flex-1">{log.message}</span>
                            </div>
                    ))
                  )}
                              </div>
                          </CardContent>
                        </Card>

            {/* Live Map Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Map Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] rounded-lg overflow-hidden border border-border">
                  <Map
                    onSelectRoad={() => {}}
                    selectedRoadId={null}
                    showDevices={true}
                    onDeviceClick={(deviceId) => setSelectedDeviceId(deviceId)}
                    selectedDeviceId={selectedDeviceId}
                  />
                    </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click on devices to select them for simulation. Watch roads and zones update in real-time.
                </p>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
