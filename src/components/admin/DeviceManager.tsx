import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Radio,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

export default function DeviceManager() {
  const devices = useQuery(api.devices.getAll);
  const createDevice = useMutation(api.devices.create);
  const updateDevice = useMutation(api.devices.update);
  const removeDevice = useMutation(api.devices.remove);
  const regenerateApiKey = useMutation(api.devices.regenerateApiKey);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Id<"iotDevices"> | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "water_level" as const,
    capabilities: [] as string[],
    owner: "",
    location: [13.6139, 123.1853] as [number, number],
  });

  const handleCreate = async () => {
    const apiKey = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await createDevice({
      apiKey,
      name: formData.name,
      type: formData.type,
      capabilities: formData.capabilities,
      owner: formData.owner,
      location: formData.location,
    });
    setShowAddModal(false);
    setFormData({
      name: "",
      type: "water_level",
      capabilities: [],
      owner: "",
      location: [13.6139, 123.1853],
    });
  };

  const handleDelete = async (id: Id<"iotDevices">) => {
    if (confirm("Are you sure you want to delete this device?")) {
      await removeDevice({ id });
    }
  };

  const handleRegenerateKey = async (id: Id<"iotDevices">) => {
    const newKey = await regenerateApiKey({ id });
    alert(`New API Key: ${newKey}\n\nSave this key securely. It won't be shown again.`);
  };

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case "water_level":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "rain_gauge":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "flow_meter":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "multi_sensor":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">IoT Device Management</h1>
            <p className="text-gray-400">Manage and monitor IoT edge devices</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Device
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Radio className="w-4 h-4" />
              <span className="text-sm font-medium">Total Devices</span>
            </div>
            <span className="text-2xl font-bold">{devices.length}</span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Online</span>
            </div>
            <span className="text-2xl font-bold">
              {devices.filter((d) => d.isAlive).length}
            </span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Offline</span>
            </div>
            <span className="text-2xl font-bold">
              {devices.filter((d) => !d.isAlive).length}
            </span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Stale</span>
            </div>
            <span className="text-2xl font-bold">
              {
                devices.filter(
                  (d) => Date.now() - d.lastSeen > 30 * 60 * 1000
                ).length
              }
            </span>
          </div>
        </div>

        {/* Devices Table */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700 border-b border-dark-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {devices.map((device) => (
                  <tr key={device._id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-gray-400 font-mono">
                          {device.apiKey.substring(0, 20)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          getDeviceTypeColor(device.type)
                        )}
                      >
                        {device.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{device.owner}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {device.isAlive ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Online</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400">Offline</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(device.lastSeen).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRegenerateKey(device._id)}
                          className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                          title="Regenerate API Key"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(device._id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Delete Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Device</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Device Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  placeholder="e.g., Sensor-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Device Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as typeof formData.type,
                    })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="water_level">Water Level Sensor</option>
                  <option value="rain_gauge">Rain Gauge</option>
                  <option value="flow_meter">Flow Meter</option>
                  <option value="multi_sensor">Multi Sensor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Owner</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) =>
                    setFormData({ ...formData, owner: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  placeholder="Organization name"
                />
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
