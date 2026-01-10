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
  MapPin,
  Pencil,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import LocationPickerModal from "./LocationPickerModal";

export default function DeviceManager() {
  const devices = useQuery(api.devices.getAll);
  const createDevice = useMutation(api.devices.create);
  const updateDevice = useMutation(api.devices.update);
  const removeDevice = useMutation(api.devices.remove);
  const regenerateApiKey = useMutation(api.devices.regenerateApiKey);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditLocationPicker, setShowEditLocationPicker] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<Id<"iotDevices"> | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "water_level" as const,
    capabilities: [] as string[],
    owner: "",
    location: [13.6139, 123.1853] as [number, number],
    influenceRadius: 500,
  });
  const [editFormData, setEditFormData] = useState<{
    name: string;
    type: "water_level" | "rain_gauge" | "flow_meter" | "multi_sensor";
    capabilities: string[];
    owner: string;
    location: [number, number];
    influenceRadius: number;
  }>({
    name: "",
    type: "water_level",
    capabilities: [],
    owner: "",
    location: [13.6139, 123.1853],
    influenceRadius: 500,
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
      influenceRadius: formData.influenceRadius,
    });
    setShowAddModal(false);
    setFormData({
      name: "",
      type: "water_level",
      capabilities: [],
      owner: "",
      location: [13.6139, 123.1853],
      influenceRadius: 500,
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

  const handleEditClick = (device: NonNullable<typeof devices>[number]) => {
    setEditingDeviceId(device._id);
    setEditFormData({
      name: device.name,
      type: device.type,
      capabilities: device.capabilities,
      owner: device.owner,
      location: device.location as [number, number],
      influenceRadius: device.influenceRadius,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingDeviceId) return;
    
    await updateDevice({
      id: editingDeviceId,
      name: editFormData.name,
      type: editFormData.type,
      capabilities: editFormData.capabilities,
      owner: editFormData.owner,
      location: editFormData.location,
      influenceRadius: editFormData.influenceRadius,
    });
    
    setShowEditModal(false);
    setEditingDeviceId(null);
    setEditFormData({
      name: "",
      type: "water_level",
      capabilities: [],
      owner: "",
      location: [13.6139, 123.1853],
      influenceRadius: 500,
    });
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingDeviceId(null);
    setEditFormData({
      name: "",
      type: "water_level",
      capabilities: [],
      owner: "",
      location: [13.6139, 123.1853],
      influenceRadius: 500,
    });
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
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5" />
            Add Device
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Radio className="w-4 h-4" />
                <span className="text-sm font-medium">Total Devices</span>
              </div>
              <span className="text-2xl font-bold">{devices.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </div>
              <span className="text-2xl font-bold">
                {devices.filter((d) => d.isAlive).length}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
              <span className="text-2xl font-bold">
                {devices.filter((d) => !d.isAlive).length}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </div>

        {/* Devices Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {device.apiKey.substring(0, 20)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getDeviceTypeColor(device.type)}
                      >
                        {device.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.owner}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(device.lastSeen).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(device)}
                          title="Edit Device"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRegenerateKey(device._id)}
                          title="Regenerate API Key"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(device._id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          title="Delete Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Add Device Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Sensor-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as typeof formData.type,
                  })
                }
              >
                <SelectTrigger id="device-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water_level">Water Level Sensor</SelectItem>
                  <SelectItem value="rain_gauge">Rain Gauge</SelectItem>
                  <SelectItem value="flow_meter">Flow Meter</SelectItem>
                  <SelectItem value="multi_sensor">Multi Sensor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                type="text"
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                placeholder="Organization name"
              />
            </div>
            <div className="space-y-2">
              <Label>Device Location</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowLocationPicker(true)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {formData.location[0].toFixed(4)}, {formData.location[1].toFixed(4)}
              </Button>
              <p className="text-xs text-muted-foreground">
                Click to select location on map
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="influence-radius">Influence Radius (meters)</Label>
              <Input
                id="influence-radius"
                type="number"
                min="100"
                max="5000"
                step="100"
                value={formData.influenceRadius}
                onChange={(e) =>
                  setFormData({ ...formData, influenceRadius: parseInt(e.target.value) || 500 })
                }
                placeholder="500"
              />
              <p className="text-xs text-muted-foreground">
                Radius around device that affects road status (default: 500m)
              </p>
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

      {/* Edit Device Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-device-name">Device Name</Label>
              <Input
                id="edit-device-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="e.g., Sensor-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-device-type">Device Type</Label>
              <Select
                value={editFormData.type}
                onValueChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    type: value as typeof editFormData.type,
                  })
                }
              >
                <SelectTrigger id="edit-device-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water_level">Water Level Sensor</SelectItem>
                  <SelectItem value="rain_gauge">Rain Gauge</SelectItem>
                  <SelectItem value="flow_meter">Flow Meter</SelectItem>
                  <SelectItem value="multi_sensor">Multi Sensor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-owner">Owner</Label>
              <Input
                id="edit-owner"
                type="text"
                value={editFormData.owner}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, owner: e.target.value })
                }
                placeholder="Organization name"
              />
            </div>
            <div className="space-y-2">
              <Label>Device Location</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowEditLocationPicker(true)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {editFormData.location[0].toFixed(4)}, {editFormData.location[1].toFixed(4)}
              </Button>
              <p className="text-xs text-muted-foreground">
                Click to select location on map
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-influence-radius">Influence Radius (meters)</Label>
              <Input
                id="edit-influence-radius"
                type="number"
                min="100"
                max="5000"
                step="100"
                value={editFormData.influenceRadius}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, influenceRadius: parseInt(e.target.value) || 500 })
                }
                placeholder="500"
              />
              <p className="text-xs text-muted-foreground">
                Radius around device that affects road status (default: 500m)
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Picker Modal */}
      <LocationPickerModal
        open={showLocationPicker}
        onOpenChange={setShowLocationPicker}
        initialLocation={formData.location}
        onLocationSelect={(location) => {
          setFormData({ ...formData, location });
        }}
      />

      {/* Edit Location Picker Modal */}
      <LocationPickerModal
        open={showEditLocationPicker}
        onOpenChange={setShowEditLocationPicker}
        initialLocation={editFormData.location}
        onLocationSelect={(location) => {
          setEditFormData({ ...editFormData, location });
        }}
      />
    </div>
  );
}
