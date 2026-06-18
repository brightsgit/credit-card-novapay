const scriptEl =
  (typeof document !== "undefined"
    ? ((document.currentScript as HTMLScriptElement | null) ??
      document.querySelector<HTMLScriptElement>("script[data-novapay-onelink]"))
    : null) ?? null;

const ds = scriptEl?.dataset ?? {};

const env = import.meta.env as Record<string, string | undefined>;

export const AF_SMART_SCRIPT_SRC = `${import.meta.env.VITE_ASSETS_BASE_URL}/smart-link.js`;

export const AF_ONELINK_URL =
  ds.novapayOnelink ??
  env.VITE_AF_ONELINK_URL ??
  "https://novapay.onelink.me/FUMF";

export const AF_ONELINK_FALLBACK =
  ds.novapayOnelinkFallback ??
  env.VITE_AF_ONELINK_FALLBACK ??
  "https://novapay.onelink.me/FUMF/og31e7p3";

export const AF_PARAMS_STORAGE_KEY = "novapay_af_params";
export const AF_QR_OPTIONS: { colorCode?: string; logo?: string } = {};

// Deep link target inside the NovaPay mobile app (URL-encoded).
export const AF_DEEP_LINK_VALUE = "novapay-mobile%3A%2F%2Fmain%2Fcredits";

// URL params Smart Script reads for each OneLink afParameter.
export const AF_PARAM_KEYS: Record<string, string[]> = {
  mediaSource: ["utm_source"],
  campaign: ["utm_campaign"],
  adSet: ["utm_content"],
  deepLinkValue: ["deep_link_value"],
  afSub1: ["deep_link_sub1"],
};

// Fallback values used when the corresponding URL param is absent.
export const AF_PARAM_DEFAULTS: Record<string, string> = {
  mediaSource: "preapproval_landing",
  campaign: "default",
  adSet: "default",
  deepLinkValue: AF_DEEP_LINK_VALUE,
  afSub1: AF_DEEP_LINK_VALUE,
};

// Custom params appended to every generated OneLink (afCustom array).
export const AF_CUSTOM_PARAMS: { paramKey: string; defaultValue: string }[] = [
  { paramKey: "af_ss_ui", defaultValue: "true" },
];
