import { logError } from "@/lib/monitoring";

type AnalyticsParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

function isGa4Ready(): boolean {
  return typeof window.gtag === "function";
}

function isMetaPixelReady(): boolean {
  return typeof window.fbq === "function";
}

export function trackGa4(event: string, params?: AnalyticsParams): void {
  if (!isGa4Ready()) return;
  try {
    window.gtag!("event", event, params ?? {});
  } catch (err) {
    logError(`GA4 event "${event}" failed`, err);
  }
}

export function trackMetaPixel(event: string, params?: AnalyticsParams): void {
  if (!isMetaPixelReady()) return;
  try {
    window.fbq!("trackCustom", event, params ?? {});
  } catch (err) {
    logError(`Meta Pixel event "${event}" failed`, err);
  }
}

export function trackEvent(event: string, params?: AnalyticsParams): void {
  trackGa4(event, params);
  trackMetaPixel(event, params);
}
