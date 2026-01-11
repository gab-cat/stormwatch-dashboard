import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { cn } from "../../lib/utils";
import { Logo } from "../ui/logo";
import { buttonVariants } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Logo subtitle="Terms of Service" size="md" />
            </Link>
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex items-center gap-2"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-muted-foreground">
              Please read these Terms of Service ("Terms") carefully before using the StormWatch flood monitoring system ("Service") operated by StormWatch ("us", "we", or "our").
            </p>
          </section>

          <Separator />

          {/* Acceptance of Terms */}
          <section id="acceptance" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, then you may not access the Service.
                </p>
                <p className="text-sm text-foreground">
                  These Terms apply to all visitors, users, and others who access or use the Service. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Description of Service */}
          <section id="service-description" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  StormWatch is a real-time flood monitoring system designed to provide information about road conditions, flood alerts, and environmental data for Naga City. The Service aggregates data from IoT sensors and provides visualization and alerting capabilities.
                </p>
                <p className="text-sm text-foreground">
                  The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* User Responsibilities */}
          <section id="user-responsibilities" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">3. User Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">You agree to:</p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                  <li>Not attempt to gain unauthorized access to any portion of the Service</li>
                  <li>Not interfere with or disrupt the Service or servers connected to the Service</li>
                  <li>Not use the Service to transmit any malicious code or harmful data</li>
                  <li>Maintain the confidentiality of any API keys or credentials provided to you</li>
                  <li>Report any security vulnerabilities or issues to us immediately</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Data Usage and Accuracy */}
          <section id="data-accuracy" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">4. Data Usage and Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  While we strive to provide accurate and up-to-date information, the data displayed on the Service is provided for informational purposes only. The Service relies on data from IoT sensors and other sources that may be subject to errors, delays, or inaccuracies.
                </p>
                <p className="text-sm text-foreground">
                  You acknowledge that:
                </p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li>Flood conditions can change rapidly and information may not always reflect current conditions</li>
                  <li>Sensor data may be incomplete, inaccurate, or unavailable at times</li>
                  <li>You should not rely solely on the Service for critical safety decisions</li>
                  <li>You should verify information through official channels and use your own judgment</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Limitation of Liability */}
          <section id="liability" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">5. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, STORMWATCH AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                </p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li>Your use or inability to use the Service</li>
                  <li>Any errors or omissions in the content or data provided by the Service</li>
                  <li>Any interruption or cessation of transmission to or from the Service</li>
                  <li>Any decisions made based on information from the Service</li>
                </ul>
                <p className="text-sm text-foreground">
                  THE SERVICE IS PROVIDED FOR INFORMATIONAL PURPOSES ONLY AND SHOULD NOT BE USED AS THE SOLE BASIS FOR CRITICAL SAFETY DECISIONS. ALWAYS CONSULT OFFICIAL SOURCES AND USE YOUR OWN JUDGMENT.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Intellectual Property */}
          <section id="intellectual-property" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">6. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  The Service and its original content, features, and functionality are owned by StormWatch and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p className="text-sm text-foreground">
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Service without our prior written consent.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Modifications to Terms */}
          <section id="modifications" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">7. Modifications to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </p>
                <p className="text-sm text-foreground">
                  What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Contact Information */}
          <section id="contact" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">8. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="text-sm text-foreground space-y-1">
                  <p><strong>Email:</strong> support@stormwatch.app</p>
                  <p><strong>Service:</strong> StormWatch - Naga City Flood Monitor</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
