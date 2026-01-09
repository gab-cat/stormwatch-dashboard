import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MapPin, Plus, Trash2, Edit } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export default function ZoneEditor() {
  const zones = useQuery(api.zones.getAll);
  const createZone = useMutation(api.zones.create);
  const updateZone = useMutation(api.zones.update);
  const removeZone = useMutation(api.zones.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    center: [13.6139, 123.1853] as [number, number],
  });

  const handleCreate = async () => {
    // For now, create a simple polygon around the center point
    // In production, this would use a map editor to draw polygons
    const lat = formData.center[0];
    const lng = formData.center[1];
    const polygon = [
      [lat + 0.01, lng + 0.01],
      [lat + 0.01, lng - 0.01],
      [lat - 0.01, lng - 0.01],
      [lat - 0.01, lng + 0.01],
      [lat + 0.01, lng + 0.01], // Close polygon
    ];

    await createZone({
      name: formData.name,
      description: formData.description,
      polygon,
      center: formData.center,
    });
    setShowAddModal(false);
    setFormData({
      name: "",
      description: "",
      center: [13.6139, 123.1853],
    });
  };

  const handleDelete = async (id: Id<"floodZones">) => {
    if (confirm("Are you sure you want to delete this zone?")) {
      await removeZone({ id });
    }
  };

  if (!zones) {
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
            <h1 className="text-3xl font-bold mb-2">Flood Zone Management</h1>
            <p className="text-gray-400">Define and manage flood prediction zones</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Zone
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone._id}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{zone.name}</h3>
                    {zone.description && (
                      <p className="text-sm text-gray-400">{zone.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(zone._id)}
                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div>
                  <span className="font-medium">Center:</span> {zone.center[0].toFixed(4)},{" "}
                  {zone.center[1].toFixed(4)}
                </div>
                <div>
                  <span className="font-medium">Polygon Points:</span> {zone.polygon.length}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(zone.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {zones.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No flood zones defined yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Create zones to receive flood predictions for specific areas.
            </p>
          </div>
        )}
      </div>

      {/* Add Zone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Flood Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Zone Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  placeholder="e.g., Downtown Naga"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  rows={3}
                  placeholder="Zone description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.center[0]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        center: [parseFloat(e.target.value) || 0, formData.center[1]],
                      })
                    }
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.center[1]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        center: [formData.center[0], parseFloat(e.target.value) || 0],
                      })
                    }
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  />
                </div>
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
