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
import {
  getPreapproveInputs,
  sendOtp,
  score,
} from "@/services/preapprove.service";
import { generateOneLink, loadSmartScript } from "@/services/appsflyer.service";
import { AF_ONELINK_FALLBACK } from "@/constants/appsflyer.constants";
import { logError } from "@/lib/monitoring";
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

const FULL_NAME_RE = /^[а-яА-ЯіІїЇєЄґҐ'\s]+$/;
const FULL_NAME_SANITIZE_RE = /[^а-яА-ЯіІїЇєЄґҐ'\s]/g;
const IPN_RE = /^\d{10}$/;
const DIGITS_ONLY_RE = /\D/g;
const PHONE_RE = /^\+380 \d{2} \d{3} \d{2} \d{2}$/;

const DATA_PATH_TO_FIELD: Record<string, keyof FormFields> = {
  "/taxpayer_id": "ipn",
  "/phone_number": "phone",
  "/client_name": "fullName",
  "/social_status": "socialStatus",
  "/monthly_income": "monthlyIncome",
};

const DATA_PATH_TO_MESSAGE: Partial<Record<string, string>> = {
  "/taxpayer_id": "Невірний номер ІПН",
};

const validator = (values: FormFields) => ({
  fullName: FULL_NAME_RE.test(values.fullName.trim())
    ? ""
    : "Вкажи ім'я та прізвище українською",
  phone: PHONE_RE.test(values.phone.replace(/_/g, "").trim())
    ? ""
    : "Неправильний номер телефону",
  ipn: IPN_RE.test(values.ipn) ? "" : "Неправильний ІПН – має бути 10 цифр",
  socialStatus: values.socialStatus ? "" : "Оберіть соціальний статус",
  monthlyIncome:
    Number(values.monthlyIncome) > 0 ? "" : "Введіть дохід більше 0",
  consent: values.consent ? "" : "Треба твоя згода",
});

export function Form() {
  const {
    values,
    valuesRef,
    errors,
    dirtyFields,
    handleChange,
    handleBlur,
    resetField,
    checkFormValidity,
    setFieldError,
  } = useForm<FormFields>({ initialValues, validator });

  const [socialStatuses, setSocialStatuses] = useState<SocialStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasErrors = useMemo(
    () => Object.values(errors).some((e) => !!e),
    [errors],
  );

  const allFieldsDirty = useMemo(
    () =>
      (Object.keys(initialValues) as (keyof FormFields)[]).every(
        (key) => !!dirtyFields[key],
      ),
    [dirtyFields],
  );

  const [otpData, setOtpData] = useState<SendOtpResponse | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [otpInvalid, setOtpInvalid] = useState(false);
  const [scoreError, setScoreError] = useState(false);
  const [oneLink, setOneLink] = useState<{
    url: string;
    dynamic: boolean;
  } | null>(null);
  const pendingRequestRef = useRef<SendOtpRequest | null>(null);
  const lastOtpCodeRef = useRef<string>("");

  const isSuccessResult = useMemo(
    () => scoreResult !== null && !scoreError,
    [scoreResult, scoreError],
  );

  useEffect(() => {
    if (!isSuccessResult) return;
    let cancelled = false;
    (async () => {
      const ready = await loadSmartScript();
      if (cancelled) return;
      const url = ready ? generateOneLink() : null;
      if (url) {
        setOneLink({ url, dynamic: true });
      } else {
        logError("OneLink unavailable, using fallback", { smartScript: ready });
        setOneLink({ url: AF_ONELINK_FALLBACK, dynamic: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuccessResult]);

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
    async (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }
      if (!checkFormValidity()) return;

      const currentValues = valuesRef.current;
      setIsSubmitting(true);
      try {
        const phone = currentValues.phone.replace(/\s/g, "");
        const request: SendOtpRequest = {
          client_name: currentValues.fullName.trim(),
          phone_number: phone,
          taxpayer_id: currentValues.ipn,
          social_status: currentValues.socialStatus as SocialStatusCode,
          monthly_income: Number(currentValues.monthlyIncome),
          confirmation: true,
        };
        const result = await sendOtp(request);
        pendingRequestRef.current = request;
        setOtpData(result);
      } catch (err) {
        const apiError = err as SendOtpErrorResponse;
        if (apiError?.errors?.length) {
          apiError.errors.forEach((e) => {
            const field = DATA_PATH_TO_FIELD[e.dataPath];
            if (field) setFieldError(field, DATA_PATH_TO_MESSAGE[e.dataPath] ?? e.message);
          });
        } else {
          console.error("Submit error", err);
          setScoreError(true);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [checkFormValidity, valuesRef, setFieldError],
  );

  const handleOtpConfirm = useCallback(async (otpCode: string) => {
    const request = pendingRequestRef.current;
    if (!request) return;
    lastOtpCodeRef.current = otpCode;
    try {
      const result = await score({ ...request, otp_code: otpCode });
      setScoreResult(result);
      setOtpData(null);
    } catch (err) {
      const apiError = err as ScoreErrorResponse;
      if (
        (apiError?.type === "processing" &&
          apiError?.code === "OTPCheckFailedError") ||
        apiError.type === "validation"
      ) {
        setOtpInvalid(true);
      } else {
        setOtpData(null);
        setScoreError(true);
      }
    }
  }, []);

  const handleResultClose = useCallback(() => {
    setScoreError(false);
    setScoreResult(null);
    setOneLink(null);
  }, []);

  const dismissScoreError = useCallback(() => setScoreError(false), []);

  const dismissOtpInvalid = useCallback(() => setOtpInvalid(false), []);

  const resultModalProps = useMemo(() => {
    if (scoreError) {
      return {
        title: "Щось пішло не так",
        buttonLabel: "Спробувати ще раз",
        onButtonClick: dismissScoreError,
      };
    }
    if (!scoreResult) {
      return null;
    }
    if (scoreResult?.client_exists) {
      return {
        title: "Ти вже з NovaPay",
        body: "Скануй QR і дізнайся свій ліміт у застосунку",
        bodyMobile: "Відкрий застосунок і дізнайся свій ліміт",
        loading: oneLink === null,
        oneLinkUrl: oneLink?.url,
        dynamicQr: oneLink?.dynamic,
        buttonLabel: "Відкрити застосунок",
      };
    }

    if (scoreResult?.existing_scoring && scoreResult?.decision) {
      return {
        title: "Ти вже маєш рішення 🎉",
        body: "Перевір Viber та SMS. Або скануй QR-код, щоб оформити Кредитку в застосунку NovaPay",
        bodyMobile:
          "Перевір Viber та SMS. Або завантаж застосунок NovaPay, щоб оформити Кредитку",
        loading: oneLink === null,
        oneLinkUrl: oneLink?.url,
        dynamicQr: oneLink?.dynamic,
        buttonLabel: "Завантажити застосунок",
      };
    }

    if (!scoreResult?.decision) {
      return {
        title: "Поки без кредитного ліміту",
        body: "Спробуй подати заявку пізніше. А поки скануй QR-код, відкривай фіолетову картку і користуйся нею вже зараз",
        bodyMobile:
          "Спробуй подати заявку пізніше. А поки завантаж застосунок NovaPay, відкрий фіолетову картку і користуйся нею вже зараз",
        loading: oneLink === null,
        oneLinkUrl: oneLink?.url,
        dynamicQr: oneLink?.dynamic,
        buttonLabel: "Завантажити застосунок",
      };
    }
    return null;
  }, [scoreError, scoreResult, dismissScoreError, oneLink]);

  const closeOtp = useCallback(() => setOtpData(null), []);

  const phoneRaw = useMemo(
    () => values.phone.replace(/\s/g, ""),
    [values.phone],
  );

  const handleFullNameChange = useCallback(
    (v: string) =>
      handleChange("fullName", v.replace(FULL_NAME_SANITIZE_RE, "")),
    [handleChange],
  );
  const handleFullNameBlur = useCallback(
    () => handleBlur("fullName"),
    [handleBlur],
  );

  const handlePhoneChange = useCallback(
    (v: string) => handleChange("phone", v),
    [handleChange],
  );
  const handlePhoneBlur = useCallback(() => handleBlur("phone"), [handleBlur]);

  const handleIpnChange = useCallback(
    (v: string) =>
      handleChange("ipn", v.replace(DIGITS_ONLY_RE, "").slice(0, 10)),
    [handleChange],
  );
  const handleIpnBlur = useCallback(() => handleBlur("ipn"), [handleBlur]);

  const handleSocialStatusChange = useCallback(
    (v: string) => {
      handleChange("socialStatus", v);
      resetField("monthlyIncome");
    },
    [handleChange, resetField],
  );

  const handleMonthlyIncomeChange = useCallback(
    (v: string) => handleChange("monthlyIncome", v),
    [handleChange],
  );

  const handleConsentChange = useCallback(
    (v: boolean) => handleChange("consent", v),
    [handleChange],
  );

  return (
    <>
      <Suspense fallback={null}>
        <OtpModal
          key={otpData?.message ?? "closed"}
          open={otpData !== null}
          onClose={closeOtp}
          otpData={otpData}
          onResend={handleSubmit}
          onConfirm={handleOtpConfirm}
          otpInvalid={otpInvalid}
          onOtpInvalidReset={dismissOtpInvalid}
          phone={phoneRaw}
        />
        {resultModalProps && (
          <ResultModal
            open={resultModalProps !== null}
            onClose={handleResultClose}
            {...(resultModalProps ?? {})}
          />
        )}
      </Suspense>
      <form className="form" onSubmit={handleSubmit}>
        <h3 className="form__title">Дізнайся свій кредитний ліміт</h3>

        <div className="form__fields">
          <Field
            name="fullName"
            placeholder="ПІБ"
            value={values.fullName}
            onChange={handleFullNameChange}
            onBlur={handleFullNameBlur}
            error={errors.fullName}
          />

          <PhoneField
            value={values.phone}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            error={errors.phone}
          />

          <Field
            name="ipn"
            placeholder="ІПН"
            inputMode="numeric"
            value={values.ipn}
            onChange={handleIpnChange}
            onBlur={handleIpnBlur}
            error={errors.ipn}
          />

          <Select
            value={values.socialStatus}
            onValueChange={handleSocialStatusChange}
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
            onValueChange={handleMonthlyIncomeChange}
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
          onChange={handleConsentChange}
          error={errors.consent}
          className="form__consent"
        >
          Я надаю{" "}
          <a
            href="https://novapay.ua/wp-content/uploads/2025/06/zgoda-personalni-dani-np.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            згоду
          </a>{" "}
          на обробку моїх персональних даних та доступ до моєї кредитної історії
        </Check>

        <Button
          type="submit"
          disabled={isSubmitting || !allFieldsDirty || hasErrors}
        >
          {isSubmitting ? "Відправляємо..." : "Дізнатися"}
        </Button>
      </form>
    </>
  );
}
