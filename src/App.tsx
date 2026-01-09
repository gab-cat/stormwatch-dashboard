import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AdminLayout from "./components/admin/AdminLayout";
import DeviceManager from "./components/admin/DeviceManager";
import ZoneEditor from "./components/admin/ZoneEditor";
import RoadManager from "./components/admin/RoadManager";
import AlertManager from "./components/admin/AlertManager";
import SimulationPanel from "./components/admin/SimulationPanel";
import DocsPage from "./components/docs/DocsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/devices" replace />} />
          <Route path="devices" element={<DeviceManager />} />
          <Route path="zones" element={<ZoneEditor />} />
          <Route path="roads" element={<RoadManager />} />
          <Route path="alerts" element={<AlertManager />} />
          <Route path="simulation" element={<SimulationPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
