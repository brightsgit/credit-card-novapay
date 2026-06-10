const scriptEl =
  (typeof document !== "undefined"
    ? ((document.currentScript as HTMLScriptElement | null) ??
      document.querySelector<HTMLScriptElement>("script[data-novapay-onelink]"))
    : null) ?? null;

const ds = scriptEl?.dataset ?? {};

const env = import.meta.env as Record<string, string | undefined>;

export const AF_SMART_SCRIPT_SRC =
  "https://onelinksmartscript.appsflyer.com/onelink-smart-script-latest.js";

export const AF_ONELINK_URL =
  ds.novapayOnelink ??
  env.VITE_AF_ONELINK_URL ??
  "https://novapay.onelink.me/FUMF";

export const AF_ONELINK_FALLBACK =
  ds.novapayOnelinkFallback ??
  env.VITE_AF_ONELINK_FALLBACK ??
  "https://novapay.onelink.me/FUMF/og31e7p3";

export const AF_PARAMS_STORAGE_KEY = "novapay_af_params";
export const AF_MEDIA_SOURCE_DEFAULT = "website";
export const AF_QR_OPTIONS: { colorCode?: string; logo?: string } = {};
export const AF_PARAM_KEYS: Record<string, string[]> = {
  mediaSource: ["pid", "utm_source", "af_pid"],
  campaign: ["c", "utm_campaign"],
  channel: ["af_channel", "utm_medium"],
  adSet: ["af_adset", "utm_term"],
  ad: ["af_ad", "utm_content"],
};
