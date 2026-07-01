import { logError } from "@/lib/monitoring";

type AnalyticsParams = Record<string, unknown>;

type TikTokIdentifyParams = {
  email?: string;
  phone_number?: string;
  external_id?: string;
};

type TikTokTrackParams = {
  contents?: Array<{
    content_id?: string;
    content_type?: string;
    content_name?: string;
  }>;
  value?: number;
  currency?: string;
};

export type LeadTrackingData = {
  email?: string;
  phone?: string;
  externalId?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      identify: (params: TikTokIdentifyParams) => void;
      track: (event: string, params?: TikTokTrackParams) => void;
    };
  }
}

function isGa4Ready(): boolean {
  return typeof window.gtag === "function";
}

function isMetaPixelReady(): boolean {
  return typeof window.fbq === "function";
}

function isTikTokPixelReady(): boolean {
  return typeof window.ttq?.track === "function";
}

async function hashSha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("380")) return `+${digits}`;
  if (digits.startsWith("0")) return `+38${digits}`;
  return `+${digits}`;
}

async function identifyTikTok(data: LeadTrackingData): Promise<void> {
  if (!window.ttq?.identify) return;

  const identifyParams: TikTokIdentifyParams = {};

  try {
    if (data.email) {
      identifyParams.email = await hashSha256(data.email);
    }

    if (data.phone) {
      identifyParams.phone_number = await hashSha256(
        normalizePhone(data.phone),
      );
    }

    if (data.externalId) {
      identifyParams.external_id = await hashSha256(data.externalId);
    }
  } catch (err) {
    logError("TikTok Pixel identify hashing failed", err);
    return;
  }

  if (Object.keys(identifyParams).length === 0) return;

  try {
    window.ttq.identify(identifyParams);
  } catch (err) {
    logError("TikTok Pixel identify failed", err);
  }
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

export function trackTikTokPixel(
  event: string,
  params?: TikTokTrackParams,
): void {
  if (!isTikTokPixelReady()) return;
  try {
    window.ttq!.track(event, params ?? {});
  } catch (err) {
    logError(`TikTok Pixel event "${event}" failed`, err);
  }
}

export async function trackLeadSuccess(data?: LeadTrackingData): Promise<void> {
  trackGa4("generate_lead");
  trackMetaPixel("Lead");

  if (data) {
    try {
      await identifyTikTok(data);
    } catch (err) {
      logError("TikTok Pixel identify failed", err);
    }
  }

  trackTikTokPixel("Lead", {
    contents: [
      {
        content_id: "preapproval",
        content_type: "product",
        content_name: "NovaPay Credit Card Preapproval",
      },
    ],
    currency: "UAH",
  });
}

export function trackEvent(event: string, params?: AnalyticsParams): void {
  trackGa4(event, params);
  trackMetaPixel(event, params);
}

const TIKTOK_PIXEL_ID = "D8V31Q3C77U79CKEID5G";

export function initTikTokPixel(): void {
  if (document.getElementById("tiktok-pixel")) return;

  const script = document.createElement("script");
  script.id = "tiktok-pixel";
  script.text = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${TIKTOK_PIXEL_ID}');ttq.page();}(window,document,'ttq');`;
  document.head.appendChild(script);
}
