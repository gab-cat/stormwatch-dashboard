import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import { Logo } from "../ui/logo";
import { buttonVariants } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

export default function PrivacyPage() {
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
              <Logo subtitle="Privacy Policy" size="md" />
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
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-muted-foreground">
              At StormWatch, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our flood monitoring service ("Service").
            </p>
          </section>

          <Separator />

          {/* Information We Collect */}
          <section id="information-collected" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold mb-2">Device and Sensor Data</h3>
                    <p className="text-sm text-foreground">
                      When you register IoT devices with our Service, we collect:
                    </p>
                    <ul className="text-sm text-foreground space-y-1 list-disc list-inside ml-4 mt-2">
                      <li>Device identification information (name, type, capabilities)</li>
                      <li>Geographic location data (latitude, longitude)</li>
                      <li>Sensor readings (water levels, rainfall, temperature, etc.)</li>
                      <li>Device metadata (battery levels, signal strength, timestamps)</li>
                      <li>Device owner/organization information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-2">Account Information</h3>
                    <p className="text-sm text-foreground">
                      If you create an account, we collect authentication information through Clerk, including email address and authentication tokens. We do not store passwords directly.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-2">Usage Data</h3>
                    <p className="text-sm text-foreground">
                      We automatically collect information about how you access and use the Service, including:
                    </p>
                    <ul className="text-sm text-foreground space-y-1 list-disc list-inside ml-4 mt-2">
                      <li>IP addresses and browser information</li>
                      <li>Pages visited and features used</li>
                      <li>Time and date of access</li>
                      <li>Device and browser type</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* How We Use Information */}
          <section id="how-we-use" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2. How We Use Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">We use the collected information for:</p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li>Providing and maintaining the flood monitoring Service</li>
                  <li>Processing and displaying sensor data and road conditions</li>
                  <li>Generating flood alerts and warnings</li>
                  <li>Authenticating users and managing access to the Service</li>
                  <li>Improving and optimizing the Service</li>
                  <li>Analyzing usage patterns and Service performance</li>
                  <li>Communicating with you about the Service</li>
                  <li>Ensuring security and preventing fraud</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Data Sharing and Disclosure */}
          <section id="data-sharing" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">3. Data Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">We may share your information in the following circumstances:</p>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold mb-2">Public Data</h3>
                    <p className="text-sm text-foreground">
                      Road condition data, flood alerts, and aggregated sensor readings are displayed publicly on the Service to help the community stay informed about flood conditions.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-2">Service Providers</h3>
                    <p className="text-sm text-foreground">
                      We use third-party services to operate the Service, including:
                    </p>
                    <ul className="text-sm text-foreground space-y-1 list-disc list-inside ml-4 mt-2">
                      <li><strong>Convex:</strong> Backend database and API services</li>
                      <li><strong>Clerk:</strong> Authentication and user management</li>
                      <li><strong>Vercel:</strong> Hosting and deployment infrastructure</li>
                    </ul>
                    <p className="text-sm text-foreground mt-2">
                      These service providers have access to your information only to perform tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-2">Legal Requirements</h3>
                    <p className="text-sm text-foreground">
                      We may disclose your information if required to do so by law or in response to valid requests by public authorities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Security */}
          <section id="data-security" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">4. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li>Encryption of data in transit using HTTPS/TLS</li>
                  <li>Secure API key authentication for device access</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure hosting infrastructure</li>
                </ul>
                <p className="text-sm text-foreground">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* User Rights */}
          <section id="user-rights" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">5. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">Depending on your location, you may have the following rights regarding your personal information:</p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Objection:</strong> Object to processing of your information</li>
                  <li><strong>Data Portability:</strong> Request transfer of your data</li>
                  <li><strong>Withdrawal of Consent:</strong> Withdraw consent where processing is based on consent</li>
                </ul>
                <p className="text-sm text-foreground">
                  To exercise these rights, please contact us using the information provided in the Contact section below.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Cookies and Tracking */}
          <section id="cookies" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">6. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                </p>
                <p className="text-sm text-foreground">
                  We use cookies for:
                </p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li>Authentication and session management</li>
                  <li>Remembering your preferences</li>
                  <li>Analyzing Service usage and performance</li>
                </ul>
                <p className="text-sm text-foreground">
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Third-Party Services */}
          <section id="third-party" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">7. Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  Our Service uses third-party services that have their own privacy policies:
                </p>
                <ul className="text-sm text-foreground space-y-2 list-disc list-inside ml-4">
                  <li><strong>Clerk:</strong> Authentication services - <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
                  <li><strong>Convex:</strong> Backend services - <a href="https://www.convex.dev/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
                  <li><strong>Vercel:</strong> Hosting services - <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
                </ul>
                <p className="text-sm text-foreground">
                  We encourage you to review the privacy policies of these third-party services. We are not responsible for the privacy practices of these services.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Children's Privacy */}
          <section id="children-privacy" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">8. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  Our Service is not intended for children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Changes to Privacy Policy */}
          <section id="changes" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">9. Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
                <p className="text-sm text-foreground">
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Contact Information */}
          <section id="contact" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">10. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
                </p>
                <div className="text-sm text-foreground space-y-1">
                  <p><strong>Email:</strong> privacy@stormwatch.app</p>
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
