import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Navigation, Trash2, Upload, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

export default function RoadManager() {
  const [statusFilter, setStatusFilter] = useState<"clear" | "risk" | "flooded" | undefined>(undefined);
  const [importing, setImporting] = useState(false);

  // Paginated query for road segments
  const { results: roadSegments, status, loadMore } = usePaginatedQuery(
    api.roadSegments.getPaginated,
    { status: statusFilter },
    { initialNumItems: 50 }
  );

  // Get stats from all segments (for dashboard stats)
  const allSegments = useQuery(api.roadSegments.getAll);
  const updateStatus = useMutation(api.roadSegments.updateStatus);
  const removeRoad = useMutation(api.roadSegments.remove);

  const handleStatusChange = async (
    id: Id<"roadSegments">,
    status: "clear" | "risk" | "flooded"
  ) => {
    await updateStatus({ id, status });
  };

  const handleDelete = async (id: Id<"roadSegments">) => {
    if (confirm("Are you sure you want to delete this road segment?")) {
      await removeRoad({ id });
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // In production, this would fetch from the OSM import script output
      // For now, show a message
      alert(
        "To import roads, run: bun scripts/import-roads.ts > roads-data.json\nThen use the bulk import mutation with the JSON data."
      );
    } finally {
      setImporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "flooded":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "risk":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "clear":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  if (!roadSegments || !allSegments) {
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
            <h1 className="text-3xl font-bold mb-2">Road Network Management</h1>
            <p className="text-gray-400">Manage road segments and their flood status</p>
          </div>
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            {importing ? "Importing..." : "Import from OSM"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Navigation className="w-4 h-4" />
              <span className="text-sm font-medium">Total Roads</span>
            </div>
            <span className="text-2xl font-bold">{allSegments.length}</span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Clear</span>
            </div>
            <span className="text-2xl font-bold">
              {allSegments.filter((r) => r.status === "clear").length}
            </span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">At Risk</span>
            </div>
            <span className="text-2xl font-bold">
              {allSegments.filter((r) => r.status === "risk").length}
            </span>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Flooded</span>
            </div>
            <span className="text-2xl font-bold">
              {allSegments.filter((r) => r.status === "flooded").length}
            </span>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-400">Filter by Status:</label>
          <select
            value={statusFilter || "all"}
            onChange={(e) =>
              setStatusFilter(
                e.target.value === "all" ? undefined : (e.target.value as "clear" | "risk" | "flooded")
              )
            }
            className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="all">All Statuses</option>
            <option value="clear">Clear</option>
            <option value="risk">At Risk</option>
            <option value="flooded">Flooded</option>
          </select>
          <span className="text-sm text-gray-400">
            Showing {roadSegments.length} road{roadSegments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Roads Table */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700 border-b border-dark-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Road Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {roadSegments.map((road) => (
                  <tr key={road._id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{road.name}</div>
                      {road.osmId && (
                        <div className="text-sm text-gray-400">OSM: {road.osmId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {road.roadType || "unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={road.status}
                        onChange={(e) =>
                          handleStatusChange(
                            road._id,
                            e.target.value as "clear" | "risk" | "flooded"
                          )
                        }
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium border bg-transparent",
                          getStatusColor(road.status)
                        )}
                      >
                        <option value="clear">Clear</option>
                        <option value="risk">At Risk</option>
                        <option value="flooded">Flooded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(road.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(road._id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {status === "CanLoadMore" && (
            <button
              onClick={() => loadMore(50)}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors"
            >
              Load More
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {status === "LoadingMore" && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Loading more...</span>
            </div>
          )}
          {status === "Exhausted" && (
            <span className="text-sm text-gray-400">All roads loaded</span>
          )}
        </div>
      </div>
    </div>
  );
}
