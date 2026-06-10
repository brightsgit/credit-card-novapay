import {
  AF_MEDIA_SOURCE_DEFAULT,
  AF_ONELINK_URL,
  AF_PARAM_KEYS,
  AF_PARAMS_STORAGE_KEY,
  AF_QR_OPTIONS,
  AF_SMART_SCRIPT_SRC,
} from "@/constants/appsflyer.constants";
import { logError } from "@/lib/monitoring";

type AfParamConfig = {
  keys?: string[];
  defaultValue?: string;
  overrideValues?: Record<string, string>;
};

type AfParameters = Record<string, AfParamConfig>;

type GenerateOneLinkConfig = {
  oneLinkURL: string;
  afParameters: AfParameters;
};

declare global {
  interface Window {
    AF_SMART_SCRIPT?: {
      generateOneLinkURL: (
        config: GenerateOneLinkConfig,
      ) => { clickURL: string } | null;
      displayQrCode: (
        divId: string,
        qrOptions?: { colorCode?: string; logo?: string },
      ) => void;
      fireImpressionsLink?: () => void;
    };
  }
}

type SavedParams = Record<string, string>;

const CAPTURE_PREFIXES = ["utm_", "af_"];
const CAPTURE_KEYS = new Set<string>([
  "pid",
  "c",
  "clickid",
  "deep_link_value",
  "is_retargeting",
  ...Object.values(AF_PARAM_KEYS).flat(),
]);

function getSavedParams(): SavedParams {
  try {
    const raw = sessionStorage.getItem(AF_PARAMS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedParams) : {};
  } catch {
    return {};
  }
}

export function captureCampaignParams(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const saved = getSavedParams();
    let changed = false;
    params.forEach((value, key) => {
      const tracked =
        CAPTURE_KEYS.has(key) ||
        CAPTURE_PREFIXES.some((p) => key.startsWith(p));
      if (tracked && value && saved[key] !== value) {
        saved[key] = value;
        changed = true;
      }
    });
    if (changed) {
      sessionStorage.setItem(AF_PARAMS_STORAGE_KEY, JSON.stringify(saved));
    }
  } catch (err) {
    logError("Failed to capture campaign params", err);
  }
}

let loadPromise: Promise<boolean> | null = null;

export function loadSmartScript(): Promise<boolean> {
  if (window.AF_SMART_SCRIPT) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${AF_SMART_SCRIPT_SRC}"]`,
    );
    const onDone = () => resolve(!!window.AF_SMART_SCRIPT);

    if (existing) {
      existing.addEventListener("load", onDone, { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = AF_SMART_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", onDone, { once: true });
    script.addEventListener(
      "error",
      () => {
        logError("Failed to load AppsFlyer Smart Script");
        resolve(false);
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return loadPromise;
}

function buildAfParameters(saved: SavedParams): AfParameters {
  const params: AfParameters = {};
  for (const [param, keys] of Object.entries(AF_PARAM_KEYS)) {
    const defaultValue = keys.map((k) => saved[k]).find(Boolean);
    params[param] = defaultValue ? { keys, defaultValue } : { keys };
  }

  params.mediaSource = {
    keys: AF_PARAM_KEYS.mediaSource,
    defaultValue: params.mediaSource?.defaultValue ?? AF_MEDIA_SOURCE_DEFAULT,
  };
  return params;
}

export function generateOneLink(): string | null {
  if (!window.AF_SMART_SCRIPT) {
    logError("generateOneLink: AF_SMART_SCRIPT not loaded");
    return null;
  }
  try {
    const config = {
      oneLinkURL: AF_ONELINK_URL,
      afParameters: buildAfParameters(getSavedParams()),
    };
    const result = window.AF_SMART_SCRIPT.generateOneLinkURL(config);
    console.debug("[novapay-form] generateOneLinkURL", config, "->", result);
    return result?.clickURL ?? null;
  } catch (err) {
    logError("generateOneLinkURL threw", err);
    return null;
  }
}

export function renderQrCode(container: HTMLElement): boolean {
  if (!window.AF_SMART_SCRIPT?.displayQrCode) return false;

  const tempId = `af-qr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const temp = document.createElement("div");
  temp.id = tempId;
  temp.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
  document.body.appendChild(temp);

  try {
    const hasOptions = Object.keys(AF_QR_OPTIONS).length > 0;
    if (hasOptions) {
      window.AF_SMART_SCRIPT.displayQrCode(tempId, AF_QR_OPTIONS);
    } else {
      window.AF_SMART_SCRIPT.displayQrCode(tempId);
    }
  } catch (err) {
    logError("displayQrCode threw", err);
    temp.remove();
    return false;
  }

  const relocate = (): boolean => {
    const canvas = temp.querySelector("canvas");
    if (!canvas) return false;
    container.replaceChildren(canvas);
    temp.remove();
    return true;
  };

  if (!relocate()) {
    requestAnimationFrame(() => {
      if (relocate()) return;
      const observer = new MutationObserver(() => {
        if (relocate()) observer.disconnect();
      });
      observer.observe(temp, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        if (temp.isConnected) {
          logError("displayQrCode produced no <canvas> within timeout");
          temp.remove();
        }
      }, 3000);
    });
  }

  return true;
}
