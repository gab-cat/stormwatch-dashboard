import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Map from './Map';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { AlertTriangle, CheckCircle, Map as MapIcon, Info, Settings, Radio, Loader2, Book } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Logo } from './ui/logo';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [selectedRoadId, setSelectedRoadId] = useState<Id<"roadSegments"> | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<Id<"iotDevices"> | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<"clear" | "risk" | "flooded" | null>(null);
  
  // Use targeted queries instead of loading all segments
  const selectedRoad = useQuery(
    api.roadSegments.getById,
    selectedRoadId ? { id: selectedRoadId } : "skip"
  );
  const floodedRoads = useQuery(api.roadSegments.getByStatus, { status: "flooded" });
  const riskRoads = useQuery(api.roadSegments.getByStatus, { status: "risk" });
  
  const updateStatus = useMutation(api.roadSegments.updateStatus);
  const devices = useQuery(api.devices.getAll);

  const handleStatusUpdate = async (status: "clear" | "risk" | "flooded") => {
    if (!selectedRoadId || updatingStatus) return;
    setUpdatingStatus(status);
    try {
      await updateStatus({ id: selectedRoadId, status });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const floodedCount = floodedRoads?.length || 0;
  const riskCount = riskRoads?.length || 0;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Logo subtitle="Naga City Flood Monitor" size="md" />
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Card className="bg-red-500/10 border-red-500/20 p-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Flooded</span>
                </div>
                <span className="text-2xl font-bold text-red-400">{floodedCount}</span>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/20 p-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">At Risk</span>
                </div>
                <span className="text-2xl font-bold text-orange-400">{riskCount}</span>
              </CardContent>
            </Card>
          </div>

          {/* Sensors List */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Sensors</h2>
            {devices && devices.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {devices.map((device) => (
                  <Card
                    key={device._id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                      selectedDeviceId === device._id && "border-primary border-2 shadow-lg bg-primary/5"
                    )}
                    onClick={() => setSelectedDeviceId(device._id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          device.isAlive ? "bg-emerald-400" : "bg-red-400"
                        )} />
                        <Radio className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{device.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {device.type.replace('_', ' ')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {device.influenceRadius}m
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No sensors configured yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Selected Road Control */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Selected Road</h2>
            
            {selectedRoad ? (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedRoad.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        selectedRoad.status === 'flooded' && "bg-red-500/10 text-red-400 border-red-500/20",
                        selectedRoad.status === 'risk' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                        selectedRoad.status === 'clear' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full mr-1.5",
                        selectedRoad.status === 'flooded' && "bg-red-400",
                        selectedRoad.status === 'risk' && "bg-orange-400",
                        selectedRoad.status === 'clear' && "bg-emerald-400",
                      )} />
                      {selectedRoad.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(selectedRoad.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleStatusUpdate('flooded')}
                      variant={selectedRoad.status === 'flooded' ? 'default' : 'secondary'}
                      disabled={updatingStatus !== null}
                      className={cn(
                        "w-full justify-between",
                        selectedRoad.status === 'flooded' && "bg-red-600 hover:bg-red-700 text-white",
                        updatingStatus === 'flooded' && "opacity-75"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {updatingStatus === 'flooded' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        Mark as Flooded
                      </span>
                      {selectedRoad.status === 'flooded' && updatingStatus !== 'flooded' && <CheckCircle className="w-4 h-4" />}
                    </Button>

                    <Button
                      onClick={() => handleStatusUpdate('risk')}
                      variant={selectedRoad.status === 'risk' ? 'default' : 'secondary'}
                      disabled={updatingStatus !== null}
                      className={cn(
                        "w-full justify-between",
                        selectedRoad.status === 'risk' && "bg-orange-600 hover:bg-orange-700 text-white",
                        updatingStatus === 'risk' && "opacity-75"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {updatingStatus === 'risk' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                        Mark as At Risk
                      </span>
                      {selectedRoad.status === 'risk' && updatingStatus !== 'risk' && <CheckCircle className="w-4 h-4" />}
                    </Button>

                    <Button
                      onClick={() => handleStatusUpdate('clear')}
                      variant={selectedRoad.status === 'clear' ? 'default' : 'secondary'}
                      disabled={updatingStatus !== null}
                      className={cn(
                        "w-full justify-between",
                        selectedRoad.status === 'clear' && "bg-emerald-600 hover:bg-emerald-700 text-white",
                        updatingStatus === 'clear' && "opacity-75"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {updatingStatus === 'clear' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Mark as Clear
                      </span>
                      {selectedRoad.status === 'clear' && updatingStatus !== 'clear' && <CheckCircle className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <MapIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a road on the map to view details and update status.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Active Alerts List */}
          <div>
             <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Active Alerts</h2>
             {floodedCount > 0 ? (
               <div className="space-y-2">
                 {floodedRoads?.map(road => (
                   <Card key={road._id} className="bg-red-500/5 border-red-500/10">
                     <CardContent className="flex items-start gap-3 p-3">
                       <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                       <div>
                         <p className="text-sm font-medium text-red-200">{road.name} is flooded</p>
                         <p className="text-xs text-red-500/60 mt-0.5">Avoid this area. Deep waters reported.</p>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-muted-foreground italic">No active flood alerts.</p>
             )}
          </div>

        </div>
        
        <div className="p-4 border-t border-border bg-card/50">
          <Button variant="secondary" className="w-full mb-2 py-2">
            <Link to="/docs" className='flex items-center justify-center py-2'>
              <Book className="w-4 h-4 mr-2" />
              Documentation
            </Link>
          </Button>
          {isLoaded && user && (
            <Button variant="secondary" className="w-full mb-2 py-2">
              <Link to="/admin" className='flex items-center justify-center py-2'>
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">
            StormWatch v1.0 • Naga City
          </p>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map 
          onSelectRoad={setSelectedRoadId} 
          selectedRoadId={selectedRoadId}
          showDevices={true}
          onDeviceClick={setSelectedDeviceId}
          selectedDeviceId={selectedDeviceId}
        />
        
        {/* Overlay Legend */}
        <Card className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-md shadow-2xl z-[1000]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm">Flooded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-sm">Risk / Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm">Passable</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
