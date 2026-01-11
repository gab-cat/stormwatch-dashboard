import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Dashboard from "./components/Dashboard";
import AdminLayout from "./components/admin/AdminLayout";
import DeviceManager from "./components/admin/DeviceManager";
import RoadManager from "./components/admin/RoadManager";
import AlertManager from "./components/admin/AlertManager";
import SimulationPanel from "./components/admin/SimulationPanel";
import DocsPage from "./components/docs/DocsPage";
import TermsPage from "./components/legal/TermsPage";
import PrivacyPage from "./components/legal/PrivacyPage";
import NotFound from "./components/NotFound";
import { updateMetadata, routeMetadata } from "./lib/seo";

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

function App() {
  return (
    <BrowserRouter>
      <MetadataManager />
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
    </BrowserRouter>
  );
}

export default App;
