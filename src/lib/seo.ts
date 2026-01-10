export interface MetadataConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_METADATA: MetadataConfig = {
  title: "StormWatch - Naga City Flood Monitor",
  description:
    "Real-time flood monitoring system for Naga City. Track road conditions, receive flood alerts, and monitor IoT sensor data to stay safe during storms and heavy rainfall.",
  keywords: "flood monitoring, storm watch, Naga City, IoT sensors, road conditions, flood alerts, weather monitoring",
  image: "/og-image.png",
  type: "website",
};

/**
 * Updates the document title and meta tags for SEO
 */
export function updateMetadata(config: Partial<MetadataConfig> = {}) {
  const metadata = { ...DEFAULT_METADATA, ...config };
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Update document title
  document.title = metadata.title;

  // Helper to update or create meta tag
  const setMetaTag = (name: string, content: string, attribute: "name" | "property" = "name") => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  // Basic meta tags
  setMetaTag("description", metadata.description);
  if (metadata.keywords) {
    setMetaTag("keywords", metadata.keywords);
  }

  // Open Graph tags
  setMetaTag("og:title", metadata.title, "property");
  setMetaTag("og:description", metadata.description, "property");
  setMetaTag("og:type", metadata.type || "website", "property");
  setMetaTag("og:image", `${baseUrl}${metadata.image || DEFAULT_METADATA.image}`, "property");
  setMetaTag("og:url", metadata.url || `${baseUrl}${window.location.pathname}`, "property");
  setMetaTag("og:site_name", "StormWatch", "property");

  // Twitter Card tags
  setMetaTag("twitter:card", "summary_large_image");
  setMetaTag("twitter:title", metadata.title);
  setMetaTag("twitter:description", metadata.description);
  setMetaTag("twitter:image", `${baseUrl}${metadata.image || DEFAULT_METADATA.image}`);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", metadata.url || `${baseUrl}${window.location.pathname}`);
}

/**
 * Route-specific metadata configurations
 */
export const routeMetadata: Record<string, MetadataConfig> = {
  "/": {
    title: "StormWatch - Naga City Flood Monitor Dashboard",
    description:
      "Real-time flood monitoring dashboard for Naga City. View current road conditions, flood alerts, and IoT sensor data to stay informed during storms.",
    keywords: "flood monitoring dashboard, Naga City, real-time flood alerts, road conditions, storm watch",
  },
  "/docs": {
    title: "StormWatch Documentation - IoT Device Integration Guide",
    description:
      "Learn how to integrate your IoT sensors with StormWatch. Complete guide for connecting devices, sending data, and configuring flood monitoring systems.",
    keywords: "IoT integration, sensor setup, API documentation, flood monitoring setup, StormWatch API",
  },
};
