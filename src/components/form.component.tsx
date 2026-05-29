import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Field } from "./field.component";
import { PhoneField } from "./phone-field.component";
import { Check } from "./check.component";
import { Select, SelectTrigger, SelectContent, SelectItem } from "./select";
import { Button } from "./button.component";
import useForm from "@/hooks/form.hook";
import { getPreapproveInputs, sendOtp } from "@/services/preapprove.service";
import type {
  SocialStatus,
  SocialStatusCode,
  SendOtpErrorResponse,
  SendOtpResponse,
  SendOtpRequest,
  ScoreResponse,
  ScoreErrorResponse,
} from "@/services/preapprove.service";

const OtpModal = lazy(() =>
  import("./otp-modal.component").then((m) => ({ default: m.OtpModal })),
);
const ResultModal = lazy(() =>
  import("./result-modal.component").then((m) => ({ default: m.ResultModal })),
);

// set to mock OTP modal without form submission
// const DEV_OTP_MOCK: SendOtpResponse | null = {
//   status: "accepted",
//   otp_sent: true,
//   message: "OTP sent",
//   resend_available_in_seconds: 30,
// };

type FormFields = {
  fullName: string;
  phone: string;
  ipn: string;
  socialStatus: string;
  monthlyIncome: string;
  consent: boolean;
};

const initialValues: FormFields = {
  fullName: "",
  phone: "",
  ipn: "",
  socialStatus: "",
  monthlyIncome: "",
  consent: false,
};

const FULL_NAME_RE = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ'\s]+$/;
const FULL_NAME_SANITIZE_RE = /[^a-zA-Zа-яА-ЯіІїЇєЄґҐ'\s]/g;
const IPN_RE = /^\d{10}$/;
const DIGITS_ONLY_RE = /\D/g;
const PHONE_RE = /^\+380 \d{2} \d{3} \d{2} \d{2}$/;

const validator = (values: FormFields) => ({
  fullName: FULL_NAME_RE.test(values.fullName.trim())
    ? ""
    : "Введіть коректне ПІБ (лише літери та пробіли)",
  phone: PHONE_RE.test(values.phone.replace(/_/g, "").trim())
    ? ""
    : "Введіть коректний номер телефону",
  ipn: IPN_RE.test(values.ipn) ? "" : "Неправильний ІПН",
  socialStatus: values.socialStatus ? "" : "Оберіть соціальний статус",
  monthlyIncome:
    Number(values.monthlyIncome) > 0 ? "" : "Введіть дохід більше 0",
  consent: values.consent ? "" : "Необхідна згода",
});

export function Form() {
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    resetField,
    checkFormValidity,
  } = useForm<FormFields>({ initialValues, validator });

  const [socialStatuses, setSocialStatuses] = useState<SocialStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpData, setOtpData] = useState<SendOtpResponse | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [otpInvalid, setOtpInvalid] = useState(false);
  const pendingRequestRef = useRef<SendOtpRequest | null>(null);

  useEffect(() => {
    getPreapproveInputs()
      .then((data) => setSocialStatuses(data.social_statuses))
      .catch(console.error);
  }, []);

  const monthlyIncomeOptions = useMemo(
    () =>
      socialStatuses.find((s) => s.code === values.socialStatus)
        ?.monthly_income_options ?? [],
    [socialStatuses, values.socialStatus],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!checkFormValidity()) return;

      setIsSubmitting(true);
      try {
        const phone = values.phone.replace(/\s/g, "");
        const request: SendOtpRequest = {
          client_name: values.fullName.trim(),
          phone_number: phone,
          taxpayer_id: values.ipn,
          social_status: values.socialStatus as SocialStatusCode,
          monthly_income: Number(values.monthlyIncome),
          confirmation: true,
        };
        const result = await sendOtp(request);
        pendingRequestRef.current = request;
        setOtpData(result);
      } catch (err) {
        const apiError = err as SendOtpErrorResponse;
        if (apiError?.errors) {
          console.error("Validation errors", apiError.errors);
        } else {
          console.error("Submit error", err);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [checkFormValidity, values],
  );

  const handleOtpConfirm = useCallback(async (otpCode: string) => {
    console.log("handleOtpConfirm");
    const request = pendingRequestRef.current;
    if (!request) return;
    try {
      // const result = await score({ ...request, otp_code: otpCode });
      const result: ScoreResponse = {
        decision: true,
        existing_scoring: false,
        client_exists: false,
      };
      setScoreResult(result);
      setOtpData(null);
    } catch (err) {
      const apiError = err as ScoreErrorResponse;
      if (apiError?.message === "OTP is invalid") {
        setOtpInvalid(true);
      } else if (apiError?.errors) {
        console.error("Score validation errors", apiError.errors);
      } else {
        console.error("Score error", err);
      }
      throw err;
    }
  }, []);

  const handleResultClose = useCallback(() => {
    setOtpInvalid(false);
    setScoreResult(null);
  }, []);

  const dismissOtpInvalid = useCallback(() => setOtpInvalid(false), []);

  const resultModalProps = useMemo(() => {
    if (otpInvalid) {
      return {
        title: "Щось пішло не так",
        buttonLabel: "Спробувати ще раз",
        onButtonClick: dismissOtpInvalid,
      };
    }
    if (scoreResult?.client_exists) {
      return {
        title: "Ти вже з NovaPay",
        body: "Скануй QR і дізнайся свій ліміт у застосунку",
        bodyMobile: "Відкрий застосунок і дізнайся свій ліміт",
        qrSrc: "/qr.svg",
        buttonLabel: "Відкрити застосунок",
        buttonHref: "https://novapay.ua/app",
      };
    }
    if (scoreResult?.decision) {
      return {
        title: "Ти вже маєш рішення 🎉",
        body: "Перевір Viber та SMS. Або скануй QR-код, щоб оформити Кредитку в застосунку NovaPay",
        bodyMobile:
          "Перевір Viber та SMS. Або завантаж застосунок NovaPay, щоб оформити Кредитку",
        qrSrc: "/qr.svg",
        buttonLabel: "Завантажити застосунок",
        buttonHref: "https://novapay.ua/app",
      };
    }
    return null;
  }, [otpInvalid, scoreResult, dismissOtpInvalid]);

  const closeOtp = useCallback(() => setOtpData(null), []);

  return (
    <>
      <Suspense fallback={null}>
        <OtpModal
          key={otpData?.message ?? "closed"}
          open={otpData !== null && !otpInvalid}
          onClose={closeOtp}
          otpData={otpData}
          phone={values.phone.replace(/\s/g, "")}
          onConfirm={handleOtpConfirm}
        />
        <ResultModal
          open={resultModalProps !== null}
          onClose={handleResultClose}
          {...(resultModalProps ?? {})}
        />
      </Suspense>
      <form className="form" onSubmit={handleSubmit}>
        <h3 className="form__title">Дізнайся свій кредитний ліміт</h3>

        <div className="form__fields">
          <Field
            name="fullName"
            placeholder="ПІБ"
            value={values.fullName}
            onChange={(v) =>
              handleChange("fullName", v.replace(FULL_NAME_SANITIZE_RE, ""))
            }
            onBlur={() => handleBlur("fullName")}
            error={errors.fullName}
          />

          <PhoneField
            value={values.phone}
            onChange={(v) => handleChange("phone", v)}
            onBlur={() => handleBlur("phone")}
            error={errors.phone}
          />

          <Field
            name="ipn"
            placeholder="ІПН"
            value={values.ipn}
            onChange={(v) =>
              handleChange("ipn", v.replace(DIGITS_ONLY_RE, "").slice(0, 10))
            }
            onBlur={() => handleBlur("ipn")}
            error={errors.ipn}
          />

          <Select
            value={values.socialStatus}
            onValueChange={(v) => {
              handleChange("socialStatus", v);
              resetField("monthlyIncome");
            }}
            error={errors.socialStatus}
          >
            <SelectTrigger placeholder="Соціальний статус" />
            <SelectContent>
              {socialStatuses.map((status) => (
                <SelectItem key={status.code} value={status.code}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={values.monthlyIncome}
            onValueChange={(v) => handleChange("monthlyIncome", v)}
            error={errors.monthlyIncome}
            disabled={!values.socialStatus}
          >
            <SelectTrigger placeholder="Дохід на місяць" />
            <SelectContent>
              {monthlyIncomeOptions.map((option) => (
                <SelectItem
                  key={option.max_value}
                  value={String(option.max_value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Check
          checked={values.consent}
          onChange={(v) => handleChange("consent", v)}
          error={errors.consent}
          className="form__consent"
        >
          Я надаю згоду на обробку моїх персональних даних та доступ до моєї
          кредитної історії
        </Check>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Відправляємо..." : "Дізнатися ліміт"}
        </Button>
      </form>
    </>
  );
}
