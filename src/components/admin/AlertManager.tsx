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

export default function AlertManager() {
  const alerts = useQuery(api.alerts.getAll);
  const activeAlerts = useQuery(api.alerts.getActive);
  const zones = useQuery(api.zones.getAll);
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
    // Get all zones for now (in production, allow selection)
    if (!zones || zones.length === 0) {
      alert("Please create flood zones first.");
      return;
    }

    await createAlert({
      title: formData.title,
      message: formData.message,
      severity: formData.severity,
      affectedZoneIds: zones.map((z) => z._id),
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Alert
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Total Alerts</span>
            </div>
            <span className="text-2xl font-bold">{alerts.length}</span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <ToggleRight className="w-4 h-4" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <span className="text-2xl font-bold">
              {activeAlerts?.length || 0}
            </span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Critical</span>
            </div>
            <span className="text-2xl font-bold">
              {alerts.filter((a) => a.severity === "critical").length}
            </span>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = getSeverityIcon(alert.severity);
            return (
              <div
                key={alert._id}
                className={cn(
                  "bg-dark-800 border rounded-xl p-6",
                  alert.isActive
                    ? getSeverityColor(alert.severity).split(" ")[0] +
                        " border-opacity-50"
                    : "border-dark-700 opacity-60"
                )}
              >
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
                        <h3 className="font-bold text-lg">{alert.title}</h3>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            getSeverityColor(alert.severity)
                          )}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-4">{alert.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>
                          Zones: {alert.affectedZoneIds.length}
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
                    <button
                      onClick={() => handleToggle(alert._id, alert.isActive)}
                      className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                      title={alert.isActive ? "Deactivate" : "Activate"}
                    >
                      {alert.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(alert._id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
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
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Alert</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  placeholder="Alert title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  rows={4}
                  placeholder="Alert message..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severity: e.target.value as typeof formData.severity,
                    })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
