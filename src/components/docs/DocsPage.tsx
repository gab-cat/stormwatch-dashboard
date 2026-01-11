import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Book,
  Code,
  Key,
  Send,
  Heart,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Logo } from "../ui/logo";
import { Button, buttonVariants } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { CodeBlock } from "./CodeBlock";

type CodeExample = {
  language: string;
  label: string;
  code: string;
};

// Get API URL from environment variable, with fallback
const API_URL = import.meta.env.VITE_API_URL || "https://your-convex-site.convex.site";

const codeExamples: Record<string, CodeExample[]> = {
  register: [
    {
      language: "curl",
      label: "cURL",
      code: `curl -X POST ${API_URL}/api/devices/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Sensor-001",
    "type": "water_level",
    "capabilities": ["water_level", "temperature"],
    "owner": "City Water Department",
    "location": [13.6139, 123.1853]
  }'`,
    },
    {
      language: "python",
      label: "Python",
      code: `import requests

url = "${API_URL}/api/devices/register"
payload = {
    "name": "Sensor-001",
    "type": "water_level",
    "capabilities": ["water_level", "temperature"],
    "owner": "City Water Department",
    "location": [13.6139, 123.1853]  # [latitude, longitude]
}

response = requests.post(url, json=payload)
data = response.json()

if response.status_code == 201:
    print(f"Device ID: {data['deviceId']}")
    print(f"API Key: {data['apiKey']}")  # Save this securely!
else:
    print(f"Error: {data.get('error', 'Unknown error')}")`,
    },
    {
      language: "javascript",
      label: "Node.js",
      code: `const response = await fetch('${API_URL}/api/devices/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Sensor-001',
    type: 'water_level',
    capabilities: ['water_level', 'temperature'],
    owner: 'City Water Department',
    location: [13.6139, 123.1853] // [latitude, longitude]
  })
});

const data = await response.json();

if (response.ok) {
  console.log('Device ID:', data.deviceId);
  console.log('API Key:', data.apiKey); // Save this securely!
} else {
  console.error('Error:', data.error);
}`,
    },
  ],
  submitReading: [
    {
      language: "curl",
      label: "cURL",
      code: `curl -X POST ${API_URL}/api/readings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "readingType": "water_level",
    "value": 45.5,
    "unit": "cm",
    "timestamp": 1704067200000,
    "metadata": {
      "battery": 85,
      "signal_strength": -65
    }
  }'`,
    },
    {
      language: "cpp",
      label: "Arduino/ESP32",
      code: `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiUrl = "${API_URL}/api/readings";
const char* apiKey = "YOUR_API_KEY";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void loop() {
  // Read sensor value (example)
  float waterLevel = readWaterLevelSensor(); // Your sensor reading function
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["readingType"] = "water_level";
  doc["value"] = waterLevel;
  doc["unit"] = "cm";
  doc["timestamp"] = millis();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["battery"] = getBatteryLevel();
  metadata["signal_strength"] = WiFi.RSSI();
  
  String payload;
  serializeJson(doc, payload);
  
  // Send HTTP POST request
  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(apiKey));
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode == 201) {
    Serial.println("Reading submitted successfully");
  } else {
    Serial.print("Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  delay(60000); // Wait 1 minute before next reading
}

float readWaterLevelSensor() {
  // Implement your sensor reading logic
  return 45.5; // Example value
}

int getBatteryLevel() {
  // Implement battery level reading
  return 85; // Example value
}`,
    },
    {
      language: "python",
      label: "MicroPython (ESP32)",
      code: `import network
import urequests
import json
import time
from machine import Pin, ADC

# WiFi Configuration
WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"
API_URL = "${API_URL}/api/readings"
API_KEY = "YOUR_API_KEY"

# Connect to WiFi
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    while not wlan.isconnected():
        time.sleep(1)
    print("WiFi connected:", wlan.ifconfig())

# Read sensor (example with ADC)
def read_sensor():
    adc = ADC(Pin(34))  # GPIO34 on ESP32
    adc.atten(ADC.ATTN_11DB)  # 0-3.3V range
    raw_value = adc.read()
    # Convert to water level in cm (adjust formula based on your sensor)
    water_level = (raw_value / 4095) * 100
    return water_level

# Submit reading
def submit_reading():
    water_level = read_sensor()
    
    payload = {
        "readingType": "water_level",
        "value": water_level,
        "unit": "cm",
        "timestamp": int(time.time() * 1000),
        "metadata": {
            "battery": 85,
            "signal_strength": -65
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = urequests.post(API_URL, json=payload, headers=headers)
        if response.status_code == 201:
            print("Reading submitted successfully")
        else:
            print(f"Error: {response.status_code}")
        response.close()
    except Exception as e:
        print(f"Error submitting reading: {e}")

# Main loop
connect_wifi()
while True:
    submit_reading()
    time.sleep(60)  # Wait 1 minute`,
    },
    {
      language: "python",
      label: "Python (Raspberry Pi)",
      code: `import requests
import time
from datetime import datetime

API_URL = "${API_URL}/api/readings"
API_KEY = "YOUR_API_KEY"

def read_sensor():
    # Implement your sensor reading logic here
    # Example: Read from GPIO, I2C sensor, etc.
    water_level = 45.5  # Replace with actual sensor reading
    return water_level

def submit_reading():
    water_level = read_sensor()
    
    payload = {
        "readingType": "water_level",
        "value": water_level,
        "unit": "cm",
        "timestamp": int(time.time() * 1000),
        "metadata": {
            "battery": 85,
            "signal_strength": -65,
            "sensor_id": "GPIO_17"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers, timeout=10)
        if response.status_code == 201:
            print(f"[{datetime.now()}] Reading submitted: {water_level}cm")
        else:
            print(f"[{datetime.now()}] Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[{datetime.now()}] Error submitting reading: {e}")

# Main loop
if __name__ == "__main__":
    while True:
        submit_reading()
        time.sleep(60)  # Wait 1 minute`,
    },
    {
      language: "javascript",
      label: "Node.js",
      code: `const fetch = require('node-fetch'); // For Node.js < 18, or use built-in fetch in Node.js 18+

const API_URL = '${API_URL}/api/readings';
const API_KEY = 'YOUR_API_KEY';

async function readSensor() {
  // Implement your sensor reading logic
  // Example: Read from GPIO, I2C, serial port, etc.
  return 45.5; // Replace with actual sensor reading
}

async function submitReading() {
  const value = await readSensor();
  
  const payload = {
    readingType: 'water_level',
    value: value,
    unit: 'cm',
    timestamp: Date.now(),
    metadata: {
      battery: 85,
      signal_strength: -65
    }
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${API_KEY}\`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(\`Reading submitted: \${value}cm\`);
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Error submitting reading:', error);
  }
}

// Submit reading every minute
setInterval(submitReading, 60000);
submitReading(); // Submit immediately`,
    },
  ],
  heartbeat: [
    {
      language: "curl",
      label: "cURL",
      code: `curl -X POST ${API_URL}/api/devices/heartbeat \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    {
      language: "python",
      label: "Python",
      code: `import requests
import time

API_URL = "${API_URL}/api/devices/heartbeat"
API_KEY = "YOUR_API_KEY"

def send_heartbeat():
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.post(API_URL, headers=headers, timeout=5)
        if response.status_code == 200:
            print("Heartbeat sent successfully")
        else:
            print(f"Error: {response.status_code}")
    except Exception as e:
        print(f"Error sending heartbeat: {e}")

# Send heartbeat every 5 minutes
while True:
    send_heartbeat()
    time.sleep(300)`,
    },
    {
      language: "cpp",
      label: "Arduino/ESP32",
      code: `#include <WiFi.h>
#include <HTTPClient.h>

const char* apiUrl = "${API_URL}/api/devices/heartbeat";
const char* apiKey = "YOUR_API_KEY";

void sendHeartbeat() {
  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Authorization", "Bearer " + String(apiKey));
  
  int httpResponseCode = http.POST("");
  
  if (httpResponseCode == 200) {
    Serial.println("Heartbeat sent");
  } else {
    Serial.print("Heartbeat error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void loop() {
  sendHeartbeat();
  delay(300000); // 5 minutes
}`,
    },
  ],
};


function CodeExamples({ examples }: { examples: CodeExample[] }) {
  if (examples.length === 0) return null;

  const defaultTab = examples[0]?.label.toLowerCase().replace(/\s+/g, "-") || "0";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Code className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Code Examples</span>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          {examples.map((example, idx) => (
            <TabsTrigger
              key={idx}
              value={example.label.toLowerCase().replace(/\s+/g, "-")}
              className="text-xs"
            >
              {example.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {examples.map((example, idx) => (
          <TabsContent
            key={idx}
            value={example.label.toLowerCase().replace(/\s+/g, "-")}
            className="mt-4"
          >
            <CodeBlock code={example.code} language={example.language} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: "api-endpoint", title: "API Endpoint", icon: Code },
    { id: "quickstart", title: "Quick Start", icon: CheckCircle },
    { id: "authentication", title: "Authentication", icon: Key },
    { id: "register-device", title: "Register Device", icon: Send },
    { id: "submit-reading", title: "Submit Reading", icon: Send },
    { id: "heartbeat", title: "Device Heartbeat", icon: Heart },
    { id: "error-handling", title: "Error Handling", icon: AlertCircle },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

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
              <Logo subtitle="API Documentation" size="md" />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Book className="w-4 h-4" />
                    Contents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-1">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      return (
                        <Button
                          key={section.id}
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            "w-full justify-start text-xs",
                            isActive && "bg-primary text-primary-foreground"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 mr-2" />
                          {section.title}
                        </Button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Introduction */}
            <section className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">IoT Device Integration Guide</h1>
              <p className="text-xl text-muted-foreground">
                Learn how to connect your IoT sensors to StormWatch and start sending
                real-time flood monitoring data.
              </p>
            </section>

            <Separator />

            {/* API Endpoint Configuration */}
            <section id="api-endpoint" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Code className="w-6 h-6 text-blue-500" />
                    API Base URL
                  </CardTitle>
                  <CardDescription>
                    The base URL for all StormWatch API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground">
                    All API requests are made to the following base URL. All endpoint paths are relative to this URL.
                  </p>
                  
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Base URL</h3>
                    <CodeBlock 
                      code={API_URL || "https://your-deployment.convex.site"}
                      language="text"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Example Endpoints</h3>
                    <p className="text-sm text-muted-foreground">
                      All endpoints are constructed by appending the path to the base URL:
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Device Registration:</p>
                        <CodeBlock 
                          code={`${API_URL || "https://your-deployment.convex.site"}/api/devices/register`}
                          language="text"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Submit Reading:</p>
                        <CodeBlock 
                          code={`${API_URL || "https://your-deployment.convex.site"}/api/readings`}
                          language="text"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Device Heartbeat:</p>
                        <CodeBlock 
                          code={`${API_URL || "https://your-deployment.convex.site"}/api/devices/heartbeat`}
                          language="text"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Code className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-blue-500">
                            Using the Base URL in Your Code
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Store the base URL as a constant or environment variable in your application. 
                            All code examples in this documentation use this base URL to construct full endpoint URLs.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </section>

            {/* Quick Start */}
            <section id="quickstart" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Quick Start
                  </CardTitle>
                  <CardDescription>
                    Get started with StormWatch in three simple steps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-primary-foreground text-sm">
                        1
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-sm">Register Your Device</h3>
                        <p className="text-sm text-muted-foreground">
                          Create a device entry via the{" "}
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                            /api/devices/register
                          </code>{" "}
                          endpoint. You'll receive an API key - save it securely!
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-primary-foreground text-sm">
                        2
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-sm">Authenticate Requests</h3>
                        <p className="text-sm text-muted-foreground">
                          Include your API key in the{" "}
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                            Authorization: Bearer YOUR_API_KEY
                          </code>{" "}
                          header for all API requests.
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-primary-foreground text-sm">
                        3
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-sm">Start Sending Readings</h3>
                        <p className="text-sm text-muted-foreground">
                          Submit sensor readings using{" "}
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                            /api/readings
                          </code>
                          . Readings are stored and can trigger flood alerts.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Authentication */}
            <section id="authentication" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Key className="w-6 h-6 text-yellow-500" />
                    Authentication
                  </CardTitle>
                  <CardDescription>
                    Secure your API requests with Bearer token authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground">
                    All API requests (except device registration) require authentication
                    using a Bearer token in the Authorization header.
                  </p>
                  <CodeBlock 
                    code="Authorization: Bearer YOUR_API_KEY" 
                    language="text" 
                  />
                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-yellow-500">
                            Security Best Practices
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Never commit API keys to version control</li>
                            <li>Store API keys securely (environment variables, secure storage)</li>
                            <li>Regenerate API keys if compromised</li>
                            <li>Use HTTPS for all API requests</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </section>

            {/* Register Device */}
            <section id="register-device" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Send className="w-6 h-6 text-blue-500" />
                    Register Device
                  </CardTitle>
                  <CardDescription>
                    Create a new device entry and receive your API key
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">Endpoint</h3>
                      <Badge variant="secondary">POST</Badge>
                    </div>
                    <CodeBlock 
                      code="/api/devices/register" 
                      language="text" 
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Request Body</h3>
                    <CodeBlock 
                      code={`{
  "name": "string",           // Device name/identifier
  "type": "water_level" | "rain_gauge" | "flow_meter" | "multi_sensor",
  "capabilities": ["string"],  // Array of sensor capabilities
  "owner": "string",          // Owner/organization name
  "location": [lat, lng],     // [latitude, longitude]
  "metadata": {}              // Optional: Additional device data
}`}
                      language="json"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Response</h3>
                    <CodeBlock 
                      code={`{
  "success": true,
  "deviceId": "j7k8l9m0...",
  "apiKey": "sk_1234567890_abc..."  // Save this!
}`}
                      language="json"
                    />
                  </div>

                  <Separator />

                  <CodeExamples examples={codeExamples.register} />
                </CardContent>
              </Card>
            </section>

            {/* Submit Reading */}
            <section id="submit-reading" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Send className="w-6 h-6 text-green-500" />
                    Submit Reading
                  </CardTitle>
                  <CardDescription>
                    Send sensor readings to StormWatch for monitoring and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">Endpoint</h3>
                      <Badge variant="secondary">POST</Badge>
                    </div>
                    <CodeBlock 
                      code="/api/readings" 
                      language="text" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Requires: Authorization header with API key
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Request Body</h3>
                    <CodeBlock 
                      code={`{
  "readingType": "water_level" | "rainfall" | "flow_rate" | "temperature" | "humidity",
  "value": 45.5,              // Numeric reading value
  "unit": "cm",               // Unit of measurement
  "timestamp": 1704067200000, // Optional: Unix timestamp in ms (defaults to now)
  "metadata": {               // Optional: Additional reading data
    "battery": 85,
    "signal_strength": -65
  }
}`}
                      language="json"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Response</h3>
                    <CodeBlock 
                      code={`{
  "success": true,
  "readingId": "a1b2c3d4...",
  "deviceId": "j7k8l9m0..."
}`}
                      language="json"
                    />
                  </div>

                  <Separator />

                  <CodeExamples examples={codeExamples.submitReading} />
                </CardContent>
              </Card>
            </section>

            {/* Heartbeat */}
            <section id="heartbeat" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Heart className="w-6 h-6 text-red-500" />
                    Device Heartbeat
                  </CardTitle>
                  <CardDescription>
                    Keep your device status updated with periodic heartbeats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">Endpoint</h3>
                      <Badge variant="secondary">POST</Badge>
                    </div>
                    <CodeBlock 
                      code="/api/devices/heartbeat" 
                      language="text" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Updates device's "last seen" timestamp and marks it as online.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Request</h3>
                    <p className="text-sm text-muted-foreground">
                      No request body required. Only requires Authorization header.
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Response</h3>
                    <CodeBlock 
                      code={`{
  "success": true,
  "deviceId": "j7k8l9m0...",
  "timestamp": 1704067200000
}`}
                      language="json"
                    />
                  </div>

                  <Separator />

                  <CodeExamples examples={codeExamples.heartbeat} />
                </CardContent>
              </Card>
            </section>

            {/* Error Handling */}
            <section id="error-handling" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    Error Handling
                  </CardTitle>
                  <CardDescription>
                    Understand error responses and implement robust error handling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-foreground">
                    All errors return a JSON response with an error message. HTTP status
                    codes indicate the type of error:
                  </p>

                  <div className="space-y-4">
                    <Card className="bg-red-500/10 border-red-500/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-red-500">401 Unauthorized</h3>
                          <Badge variant="destructive" className="text-xs">401</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Missing or invalid API key in Authorization header.
                        </p>
                        <div className="mt-2">
                          <CodeBlock 
                            code={`{"error": "Invalid API key"}`}
                            language="json"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-yellow-500">400 Bad Request</h3>
                          <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">400</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Missing required fields or invalid data format.
                        </p>
                        <div className="mt-2">
                          <CodeBlock 
                            code={`{"error": "Missing required fields: readingType, value, unit"}`}
                            language="json"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-500/10 border-blue-500/20">
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold text-sm text-blue-500 mb-2">Best Practices</h3>
                        <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                          <li>
                            Always check HTTP status codes before processing responses
                          </li>
                          <li>Implement exponential backoff for retries</li>
                          <li>Log errors for debugging but don't expose sensitive data</li>
                          <li>Handle network timeouts gracefully</li>
                          <li>Validate sensor readings before sending (range checks, NaN checks)</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
