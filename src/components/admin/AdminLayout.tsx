import { Outlet, Link, useLocation } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";
import {
  Radio,
  MapPin,
  Navigation,
  AlertTriangle,
  LogOut,
  CloudRain,
  Play,
} from "lucide-react";
import { cn } from "../../lib/utils";

export default function AdminLayout() {
  const { user, isLoaded } = useUser();
  const location = useLocation();

  const navItems = [
    { path: "/admin/devices", label: "Devices", icon: Radio },
    { path: "/admin/zones", label: "Flood Zones", icon: MapPin },
    { path: "/admin/roads", label: "Roads", icon: Navigation },
    { path: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
    { path: "/admin/simulation", label: "Simulation", icon: Play },
  ];

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-dark-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-dark-900 text-white">
        <div className="w-full max-w-md px-6">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 bg-brand-600 rounded-lg">
                  <CloudRain className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">StormWatch</h1>
              </div>
              <h2 className="text-xl font-semibold mb-2">Login</h2>
              <p className="text-sm text-gray-400">
                Sign in to access the admin panel
              </p>
            </div>
            <div className="flex justify-center">
              <SignInButton mode="modal">
                <button className="w-full px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-dark-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-dark-700 bg-dark-800 flex flex-col">
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-brand-600 rounded-lg">
              <CloudRain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">StormWatch</h1>
          </div>
          <p className="text-xs text-gray-400 ml-12">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-gray-300 hover:bg-dark-700 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
              <span className="text-xs font-bold">
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName || user.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-gray-400 truncate">Administrator</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
