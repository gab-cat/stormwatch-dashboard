import { useState } from 'react';
import { Link } from 'react-router-dom';
import Map from './Map';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { AlertTriangle, CheckCircle, CloudRain, Map as MapIcon, Info, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import PredictionCards from './public/PredictionCards';

export default function Dashboard() {
  const [selectedRoadId, setSelectedRoadId] = useState<Id<"roadSegments"> | null>(null);
  const roadSegments = useQuery(api.roadSegments.getAll);
  const updateStatus = useMutation(api.roadSegments.updateStatus);

  const selectedRoad = roadSegments?.find(r => r._id === selectedRoadId);

  const handleStatusUpdate = async (status: "clear" | "risk" | "flooded") => {
    if (!selectedRoadId) return;
    await updateStatus({ id: selectedRoadId, status });
  };

  const floodedCount = roadSegments?.filter(r => r.status === 'flooded').length || 0;
  const riskCount = roadSegments?.filter(r => r.status === 'risk').length || 0;

  return (
    <div className="flex h-screen w-full bg-dark-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-dark-700 bg-dark-800 flex flex-col">
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-brand-600 rounded-lg">
              <CloudRain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">StormWatch</h1>
          </div>
          <p className="text-xs text-gray-400 ml-12">Naga City Flood Monitor</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Flooded</span>
              </div>
              <span className="text-2xl font-bold text-red-400">{floodedCount}</span>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <Info className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">At Risk</span>
              </div>
              <span className="text-2xl font-bold text-orange-400">{riskCount}</span>
            </div>
          </div>

          {/* Selected Road Control */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Selected Area</h2>
            
            {selectedRoad ? (
              <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600">
                <h3 className="text-lg font-bold mb-1">{selectedRoad.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    selectedRoad.status === 'flooded' && "bg-red-500/10 text-red-400 border-red-500/20",
                    selectedRoad.status === 'risk' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                    selectedRoad.status === 'clear' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      selectedRoad.status === 'flooded' && "bg-red-400",
                      selectedRoad.status === 'risk' && "bg-orange-400",
                      selectedRoad.status === 'clear' && "bg-emerald-400",
                    )} />
                    {selectedRoad.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated {new Date(selectedRoad.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => handleStatusUpdate('flooded')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      selectedRoad.status === 'flooded' 
                        ? "bg-red-600 text-white shadow-lg shadow-red-900/20" 
                        : "bg-dark-600 hover:bg-dark-500 text-gray-300 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Mark as Flooded
                    </span>
                    {selectedRoad.status === 'flooded' && <CheckCircle className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => handleStatusUpdate('risk')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      selectedRoad.status === 'risk' 
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" 
                        : "bg-dark-600 hover:bg-dark-500 text-gray-300 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Mark as At Risk
                    </span>
                    {selectedRoad.status === 'risk' && <CheckCircle className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => handleStatusUpdate('clear')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      selectedRoad.status === 'clear' 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                        : "bg-dark-600 hover:bg-dark-500 text-gray-300 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Mark as Clear
                    </span>
                    {selectedRoad.status === 'clear' && <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-dark-700/30 rounded-xl p-8 text-center border border-dark-700 border-dashed">
                <MapIcon className="w-8 h-8 text-dark-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Select a road on the map to view details and update status.</p>
              </div>
            )}
          </div>
          
          {/* Flood Predictions */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Flood Predictions</h2>
            <div className="max-h-96 overflow-y-auto">
              <PredictionCards />
            </div>
          </div>

          {/* Active Alerts List */}
          <div>
             <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Active Alerts</h2>
             {floodedCount > 0 ? (
               <div className="space-y-2">
                 {roadSegments?.filter(r => r.status === 'flooded').map(road => (
                   <div key={road._id} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                     <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                     <div>
                       <p className="text-sm font-medium text-red-200">{road.name} is flooded</p>
                       <p className="text-xs text-red-500/60 mt-0.5">Avoid this area. Deep waters reported.</p>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-gray-500 italic">No active flood alerts.</p>
             )}
          </div>

        </div>
        
        <div className="p-4 border-t border-dark-700 bg-dark-800/50">
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 mb-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Admin Panel
          </Link>
          <p className="text-xs text-center text-gray-500">
            StormWatch v1.0 • Naga City
          </p>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map onSelectRoad={setSelectedRoadId} selectedRoadId={selectedRoadId} />
        
        {/* Overlay Legend */}
        <div className="absolute bottom-6 right-6 bg-dark-900/90 backdrop-blur-md border border-dark-700 p-4 rounded-xl shadow-2xl z-[1000]">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm text-gray-300">Flooded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-sm text-gray-300">Risk / Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-sm text-gray-300">Passable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
