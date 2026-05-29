import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api.constants";

export type MonthlyIncomeOption = {
  label: string;
  max_value: number;
};

export type SocialStatus = {
  code: string;
  label: string;
  monthly_income_options: MonthlyIncomeOption[];
};

export type PreapproveInputs = {
  social_statuses: SocialStatus[];
};

const MOCK_PREAPPROVE_INPUTS: PreapproveInputs = {
  social_statuses: [
    {
      code: "employee",
      label: "Найманий працівник mock",
      monthly_income_options: [
        { label: "1 - 10 000", max_value: 10000 },
        { label: "10 001 - 20 000", max_value: 20000 },
      ],
    },
    {
      code: "student",
      label: "Студент",
      monthly_income_options: [
        { label: "1 - 5 000", max_value: 5000 },
        { label: "5 001 - 10 000", max_value: 10000 },
      ],
    },
    {
      code: "retired",
      label: "Пенсіонер",
      monthly_income_options: [
        { label: "1 - 5 000", max_value: 5000 },
        { label: "5 001 - 10 000", max_value: 10000 },
      ],
    },
    {
      code: "self_employed",
      label: "Самозайнятий",
      monthly_income_options: [
        { label: "1 - 10 000", max_value: 10000 },
        { label: "10 001 - 30 000", max_value: 30000 },
      ],
    },
    {
      code: "unemployed",
      label: "Безробітний",
      monthly_income_options: [
        { label: "1 - 3 000", max_value: 3000 },
        { label: "3 001 - 5 000", max_value: 5000 },
      ],
    },
  ],
};

export type SocialStatusCode =
  | "employee"
  | "private_entrepreneur"
  | "attorney"
  | "unemployed"
  | "pensioner"
  | "student"
  | "civil_servant"
  | "serviceman"
  | "maternity_leave";

export type SendOtpRequest = {
  client_name: string;
  phone_number: string;
  taxpayer_id: string;
  social_status: SocialStatusCode;
  monthly_income: number;
  confirmation: true;
};

export type ScoreRequest = SendOtpRequest & {
  otp_code: string;
};

export type ScoreResponse = {
  decision: boolean | null;
  existing_scoring: boolean | null;
  client_exists: boolean;
};

export type ScoreErrorResponse = {
  message: string;
  errors?: Array<{ field: string; message: string }>;
};

export type SendOtpResponse = {
  status: "accepted";
  otp_sent: boolean;
  resend_available_in_seconds: number;
  message: string;
};

export type SendOtpValidationError = {
  field: string;
  message: string;
};

export type SendOtpErrorResponse = {
  message: string;
  errors: SendOtpValidationError[];
};

const USE_MOCK = true;

export async function getPreapproveInputs(): Promise<PreapproveInputs> {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_PREAPPROVE_INPUTS);
  }

  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.PREAPPROVE_INPUTS}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch preapprove inputs: ${response.status}`);
  }

  return response.json();
}

export async function score(data: ScoreRequest): Promise<ScoreResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.PREAPPROVE_SCORE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (response.status === 400 || response.status === 500) {
    const error: ScoreErrorResponse = await response.json();
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Pre-approval process failed: ${response.status}`);
  }

  return response.json();
}

export async function sendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.PREAPPROVE_SEND_OTP}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  if (response.status === 400) {
    const error: SendOtpErrorResponse = await response.json();
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Failed to send OTP: ${response.status}`);
  }

  return response.json();
}
