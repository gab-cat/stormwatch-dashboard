import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { updateMetadata, routeMetadata } from "./lib/seo";

// Lazy load all route components for code splitting
const Dashboard = lazy(() => import("./components/Dashboard"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const DeviceManager = lazy(() => import("./components/admin/DeviceManager"));
const RoadManager = lazy(() => import("./components/admin/RoadManager"));
const AlertManager = lazy(() => import("./components/admin/AlertManager"));
const SimulationPanel = lazy(() => import("./components/admin/SimulationPanel"));
const DocsPage = lazy(() => import("./components/docs/DocsPage"));
const TermsPage = lazy(() => import("./components/legal/TermsPage"));
const PrivacyPage = lazy(() => import("./components/legal/PrivacyPage"));
const NotFound = lazy(() => import("./components/NotFound"));

function MetadataManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const metadata = routeMetadata[path];
    
    if (metadata) {
      updateMetadata({
        ...metadata,
        url: `${window.location.origin}${path}`,
      });
    } else {
      // Use default metadata for routes not in routeMetadata
      updateMetadata({
        url: `${window.location.origin}${path}`,
      });
    }
  }, [location.pathname]);

  return null;
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MetadataManager />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/devices" replace />} />
            <Route path="devices" element={<DeviceManager />} />
            <Route path="roads" element={<RoadManager />} />
            <Route path="alerts" element={<AlertManager />} />
            <Route path="simulation" element={<SimulationPanel />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
