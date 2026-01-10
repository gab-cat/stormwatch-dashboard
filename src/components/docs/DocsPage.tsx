import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Book,
  Code,
  Key,
  Send,
  Heart,
  CheckCircle,
  AlertCircle,
  Copy,
  ArrowLeft,
  CloudRain,
} from "lucide-react";
import { cn } from "../../lib/utils";

type CodeExample = {
  language: string;
  label: string;
  code: string;
};

const codeExamples: Record<string, CodeExample[]> = {
  register: [
    {
      language: "curl",
      label: "cURL",
      code: `curl -X POST https://your-convex-site.convex.site/api/devices/register \\
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

url = "https://your-convex-site.convex.site/api/devices/register"
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
      code: `const response = await fetch('https://your-convex-site.convex.site/api/devices/register', {
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
      code: `curl -X POST https://your-convex-site.convex.site/api/readings \\
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
const char* apiUrl = "https://your-convex-site.convex.site/api/readings";
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
API_URL = "https://your-convex-site.convex.site/api/readings"
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

API_URL = "https://your-convex-site.convex.site/api/readings"
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

const API_URL = 'https://your-convex-site.convex.site/api/readings';
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
      code: `curl -X POST https://your-convex-site.convex.site/api/devices/heartbeat \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    {
      language: "python",
      label: "Python",
      code: `import requests
import time

API_URL = "https://your-convex-site.convex.site/api/devices/heartbeat"
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

const char* apiUrl = "https://your-convex-site.convex.site/api/devices/heartbeat";
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

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-4 right-4 p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="Copy code"
      >
        {copied ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      <pre className="bg-dark-900 border border-dark-700 rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

function CodeExamples({ examples }: { examples: CodeExample[] }) {
  const [activeTab, setActiveTab] = useState(0);

  if (examples.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Code className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">Code Examples</span>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-dark-700 overflow-x-auto">
        {examples.map((example, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={cn(
              "px-4 py-2 text-sm transition-colors whitespace-nowrap",
              activeTab === idx
                ? "text-white border-b-2 border-brand-600"
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <CodeBlock
        code={examples[activeTab].code}
        language={examples[activeTab].language}
      />
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: "quickstart", title: "Quick Start" },
    { id: "authentication", title: "Authentication" },
    { id: "register-device", title: "Register Device" },
    { id: "submit-reading", title: "Submit Reading" },
    { id: "heartbeat", title: "Device Heartbeat" },
    { id: "error-handling", title: "Error Handling" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="p-2 bg-brand-600 rounded-lg">
                  <CloudRain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-semibold">StormWatch</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-300">API Documentation</span>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Contents
                </h2>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
                        activeSection === section.id
                          ? "bg-brand-600 text-white"
                          : "text-gray-300 hover:bg-dark-700 hover:text-white"
                      )}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            {/* Introduction */}
            <section>
              <h1 className="text-4xl font-semibold mb-4">IoT Device Integration Guide</h1>
              <p className="text-xl text-gray-400 mb-6">
                Learn how to connect your IoT sensors to StormWatch and start sending
                real-time flood monitoring data.
              </p>
            </section>

            {/* Quick Start */}
            <section id="quickstart" className="scroll-mt-24">
              <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                Quick Start
              </h2>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Register Your Device</h3>
                      <p className="text-gray-400 text-sm">
                        Create a device entry via the{" "}
                        <code className="px-1.5 py-0.5 bg-dark-700 rounded text-sm">
                          /api/devices/register
                        </code>{" "}
                        endpoint. You'll receive an API key - save it securely!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Authenticate Requests</h3>
                      <p className="text-gray-400 text-sm">
                        Include your API key in the{" "}
                        <code className="px-1.5 py-0.5 bg-dark-700 rounded text-sm">
                          Authorization: Bearer YOUR_API_KEY
                        </code>{" "}
                        header for all API requests.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Start Sending Readings</h3>
                      <p className="text-gray-400 text-sm">
                        Submit sensor readings using{" "}
                        <code className="px-1.5 py-0.5 bg-dark-700 rounded text-sm">
                          /api/readings
                        </code>
                        . Readings are stored and can trigger flood alerts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className="scroll-mt-24">
              <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
                <Key className="w-6 h-6 text-yellow-400" />
                Authentication
              </h2>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-4">
                <p className="text-gray-300">
                  All API requests (except device registration) require authentication
                  using a Bearer token in the Authorization header.
                </p>
                <div className="bg-dark-900 border border-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-400 mb-1">
                        Security Best Practices
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                        <li>Never commit API keys to version control</li>
                        <li>Store API keys securely (environment variables, secure storage)</li>
                        <li>Regenerate API keys if compromised</li>
                        <li>Use HTTPS for all API requests</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Register Device */}
            <section id="register-device" className="scroll-mt-24">
              <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
                <Send className="w-6 h-6 text-blue-400" />
                Register Device
              </h2>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2">Endpoint</h3>
                  <code className="text-lg bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 block">
                    POST /api/devices/register
                  </code>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Request Body</h3>
                  <div className="bg-dark-900 border border-dark-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">
                      <code>{`{
  "name": "string",           // Device name/identifier
  "type": "water_level" | "rain_gauge" | "flow_meter" | "multi_sensor",
  "capabilities": ["string"],  // Array of sensor capabilities
  "owner": "string",          // Owner/organization name
  "location": [lat, lng],     // [latitude, longitude]
  "metadata": {}              // Optional: Additional device data
}`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Response</h3>
                  <div className="bg-dark-900 border border-dark-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">
                      <code>{`{
  "success": true,
  "deviceId": "j7k8l9m0...",
  "apiKey": "sk_1234567890_abc..."  // Save this!
}`}</code>
                    </pre>
                  </div>
                </div>

                <CodeExamples examples={codeExamples.register} />
              </div>
            </section>

            {/* Submit Reading */}
            <section id="submit-reading" className="scroll-mt-24">
              <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
                <Send className="w-6 h-6 text-green-400" />
                Submit Reading
              </h2>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2">Endpoint</h3>
                  <code className="text-lg bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 block">
                    POST /api/readings
                  </code>
                  <p className="text-sm text-gray-400 mt-2">
                    Requires: Authorization header with API key
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Request Body</h3>
                  <div className="bg-dark-900 border border-dark-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">
                      <code>{`{
  "readingType": "water_level" | "rainfall" | "flow_rate" | "temperature" | "humidity",
  "value": 45.5,              // Numeric reading value
  "unit": "cm",               // Unit of measurement
  "timestamp": 1704067200000, // Optional: Unix timestamp in ms (defaults to now)
  "metadata": {               // Optional: Additional reading data
    "battery": 85,
    "signal_strength": -65
  }
}`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Response</h3>
                  <div className="bg-dark-900 border border-dark-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">
                      <code>{`{
  "success": true,
  "readingId": "a1b2c3d4...",
  "deviceId": "j7k8l9m0..."
}`}</code>
                    </pre>
                  </div>
                </div>

                <CodeExamples examples={codeExamples.submitReading} />
              </div>
            </section>

            {/* Heartbeat */}
            <section id="heartbeat" className="scroll-mt-24">
              <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-400" />
                Device Heartbeat
              </h2>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2">Endpoint</h3>
                  <code className="text-lg bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 block">
                    POST /api/devices/heartbeat
                  </code>
                  <p className="text-sm text-gray-400 mt-2">
                    Updates device's "last seen" timestamp and marks it as online.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Request</h3>
                  <p className="text-gray-300 mb-2">
                    No request body required. Only requires Authorization header.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Response</h3>
                  <div className="bg-dark-900 border border-dark-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">
                      <code>{`{
  "success": true,
  "deviceId": "j7k8l9m0...",
  "timestamp": 1704067200000
}`}</code>
                    </pre>
                  </div>
                </div>

                <CodeExamples examples={codeExamples.heartbeat} />
              </div>
            </section>

            {/* Error Handling */}
            <section id="error-handling" className="scroll-mt-24">
              <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-400" />
                Error Handling
              </h2>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-6">
                <p className="text-gray-300">
                  All errors return a JSON response with an error message. HTTP status
                  codes indicate the type of error:
                </p>

                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h3 className="font-medium text-red-400 mb-2">401 Unauthorized</h3>
                    <p className="text-sm text-gray-300 mb-2">
                      Missing or invalid API key in Authorization header.
                    </p>
                    <div className="bg-dark-900 rounded p-2 mt-2">
                      <code className="text-xs">{`{"error": "Invalid API key"}`}</code>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-400 mb-2">400 Bad Request</h3>
                    <p className="text-sm text-gray-300 mb-2">
                      Missing required fields or invalid data format.
                    </p>
                    <div className="bg-dark-900 rounded p-2 mt-2">
                      <code className="text-xs">{`{"error": "Missing required fields: readingType, value, unit"}`}</code>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="font-medium text-blue-400 mb-2">Best Practices</h3>
                    <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                      <li>
                        Always check HTTP status codes before processing responses
                      </li>
                      <li>Implement exponential backoff for retries</li>
                      <li>Log errors for debugging but don't expose sensitive data</li>
                      <li>Handle network timeouts gracefully</li>
                      <li>Validate sensor readings before sending (range checks, NaN checks)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
