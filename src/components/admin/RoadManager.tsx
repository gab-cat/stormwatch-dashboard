import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Navigation, Trash2, Upload, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Label } from "../ui/label";

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
          <Button onClick={handleImport} disabled={importing}>
            <Upload className="w-5 h-5 mr-2" />
            {importing ? "Importing..." : "Import from OSM"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Navigation className="w-4 h-4" />
                <span className="text-sm font-medium">Total Roads</span>
              </div>
              <span className="text-2xl font-bold">{allSegments.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Clear</span>
              </div>
              <span className="text-2xl font-bold">
                {allSegments.filter((r) => r.status === "clear").length}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">At Risk</span>
              </div>
              <span className="text-2xl font-bold">
                {allSegments.filter((r) => r.status === "risk").length}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Flooded</span>
              </div>
              <span className="text-2xl font-bold">
                {allSegments.filter((r) => r.status === "flooded").length}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-4">
          <Label>Filter by Status:</Label>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              setStatusFilter(
                value === "all" ? undefined : (value as "clear" | "risk" | "flooded")
              )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="clear">Clear</SelectItem>
              <SelectItem value="risk">At Risk</SelectItem>
              <SelectItem value="flooded">Flooded</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Showing {roadSegments.length} road{roadSegments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Roads Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Road Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roadSegments.map((road) => (
                  <TableRow key={road._id}>
                    <TableCell>
                      <div className="font-medium">{road.name}</div>
                      {road.osmId && (
                        <div className="text-sm text-muted-foreground">OSM: {road.osmId}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {road.roadType || "unknown"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={road.status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            road._id,
                            value as "clear" | "risk" | "flooded"
                          )
                        }
                      >
                        <SelectTrigger className={cn("w-[140px] border", getStatusColor(road.status))}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clear">Clear</SelectItem>
                          <SelectItem value="risk">At Risk</SelectItem>
                          <SelectItem value="flooded">Flooded</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(road.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(road._id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {status === "CanLoadMore" && (
            <Button onClick={() => loadMore(50)}>
              Load More
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {status === "LoadingMore" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
              <span>Loading more...</span>
            </div>
          )}
          {status === "Exhausted" && (
            <span className="text-sm text-muted-foreground">All roads loaded</span>
          )}
        </div>
      </div>
    </div>
  );
}
