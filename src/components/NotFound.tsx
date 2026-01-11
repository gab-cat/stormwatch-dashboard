import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CloudOff, Home, ArrowLeft, Book, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Logo } from './ui/logo';
import { updateMetadata } from '../lib/seo';

export default function NotFound() {
  useEffect(() => {
    updateMetadata({
      title: "404 - Page Not Found | StormWatch",
      description: "The page you're looking for could not be found. Return to the StormWatch dashboard to monitor flood conditions in Naga City.",
      keywords: "404, page not found, StormWatch, flood monitoring",
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern - storm clouds effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-foreground rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CloudOff className="w-24 h-24 text-muted-foreground/30 animate-in fade-in-0 zoom-in-95" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl font-bold text-primary/20">404</span>
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold mb-3 animate-in fade-in-0 slide-in-from-bottom-2">
              Page Not Found
            </CardTitle>
            <p className="text-muted-foreground text-sm md:text-base animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '100ms' }}>
              The page you're looking for seems to have been swept away by the storm.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="flex justify-center animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '200ms' }}>
              <Logo subtitle="Naga City Flood Monitor" size="md" />
            </div>

            {/* Navigation buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: '300ms' }}>
              <Button
                variant="default"
                size="lg"
                className="w-full min-h-[44px] group"
              >
                <Link to="/" className="flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </Link>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="w-full min-h-[44px] group"
              >
                <Link to="/docs" className="flex items-center justify-center gap-2">
                  <Book className="w-4 h-4" />
                  <span>Documentation</span>
                </Link>
              </Button>
            </div>

            {/* Quick links */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Quick Links
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <Link to="/" className="flex items-center gap-1.5">
                    <Map className="w-3 h-3" />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <Link to="/docs" className="flex items-center gap-1.5">
                    <Book className="w-3 h-3" />
                    Docs
                  </Link>
                </Button>
              </div>
            </div>

            {/* Back button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full min-h-[44px]"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-in fade-in-0" style={{ animationDelay: '400ms' }}>
          If you believe this is an error, please check the URL or return to the dashboard.
        </p>
      </div>
    </div>
  );
}
