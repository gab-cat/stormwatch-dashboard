import { Outlet, Link, useLocation } from "react-router-dom";
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import {
  Radio,
  Navigation,
  AlertTriangle,
  LogOut,
  Play,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Logo } from "../ui/logo";

export default function AdminLayout() {
  const { user, isLoaded } = useUser();
  const location = useLocation();

  const navItems = [
    { path: "/admin/devices", label: "Devices", icon: Radio },
    { path: "/admin/roads", label: "Roads", icon: Navigation },
    { path: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
    { path: "/admin/simulation", label: "Simulation", icon: Play },
  ];

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-md px-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Logo subtitle="Admin Panel" size="lg" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Login</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to access the admin panel
              </p>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button className="w-full" size="lg">
                  Sign In
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Logo subtitle="Admin Panel" size="md" />
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName || user.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-muted-foreground truncate">Administrator</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start">
              <LogOut className="w-4 h-4" />
              Back to Dashboard
            </Button>
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
