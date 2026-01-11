import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  AlertTriangle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";

export default function AlertManager() {
  const alerts = useQuery(api.alerts.getAll);
  const activeAlerts = useQuery(api.alerts.getActive);
  const devices = useQuery(api.devices.getAll);
  const createAlert = useMutation(api.alerts.create);
  const updateStatus = useMutation(api.alerts.updateStatus);
  const removeAlert = useMutation(api.alerts.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "warning" as const,
  });

  const handleCreate = async () => {
    // Get all devices for now (in production, allow selection)
    if (!devices || devices.length === 0) {
      alert("Please create devices first.");
      return;
    }

    await createAlert({
      title: formData.title,
      message: formData.message,
      severity: formData.severity,
      affectedDeviceIds: devices.map((d) => d._id),
      isActive: true,
    });
    setShowAddModal(false);
    setFormData({ title: "", message: "", severity: "warning" });
  };

  const handleToggle = async (id: Id<"alerts">, isActive: boolean) => {
    await updateStatus({ id, isActive: !isActive });
  };

  const handleDelete = async (id: Id<"alerts">) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      await removeAlert({ id });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "danger":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "info":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "danger":
        return AlertTriangle;
      case "warning":
        return AlertCircle;
      default:
        return Info;
    }
  };

  if (!alerts) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Alert Management</h1>
            <p className="text-gray-400">Manage flood warnings and alerts</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Alert
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Total Alerts</span>
              </div>
              <span className="text-2xl font-bold">{alerts.length}</span>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <ToggleRight className="w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <span className="text-2xl font-bold">
                {activeAlerts?.length || 0}
              </span>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Critical</span>
              </div>
              <span className="text-2xl font-bold">
                {alerts.filter((a) => a.severity === "critical").length}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = getSeverityIcon(alert.severity);
            return (
              <Card
                key={alert._id}
                className={cn(
                  alert.isActive
                    ? (() => {
                        const colors = getSeverityColor(alert.severity).split(" ");
                        const bgColor = colors[0];
                        const borderColor = colors[2]?.replace("/20", "/10") || "border-border/50";
                        return `${bgColor} ${borderColor}`;
                      })()
                    : "opacity-60"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={cn(
                          "p-3 rounded-lg",
                          getSeverityColor(alert.severity).split(" ")[0]
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge
                            variant="outline"
                            className={getSeverityColor(alert.severity)}
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">{alert.message}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Devices: {alert.affectedDeviceIds.length}
                          </span>
                          <span>
                            Created: {new Date(alert.createdAt).toLocaleString()}
                          </span>
                          {alert.expiresAt && (
                            <span>
                              Expires: {new Date(alert.expiresAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(alert._id, alert.isActive)}
                        title={alert.isActive ? "Deactivate" : "Activate"}
                      >
                        {alert.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(alert._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No alerts created yet.</p>
          </div>
        )}
      </div>

      {/* Add Alert Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Alert title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
                placeholder="Alert message..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    severity: value as typeof formData.severity,
                  })
                }
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="danger">Danger</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
