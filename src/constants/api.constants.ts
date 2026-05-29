export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const API_ENDPOINTS = {
  PREAPPROVE_INPUTS: "/preapprove/inputs",
  PREAPPROVE_SEND_OTP: "/preapprove/send-otp",
  PREAPPROVE_SCORE: "/preapprove/score",
} as const;
