import { useRef, useState, useCallback, useEffect } from "react";
import { Modal } from "./modal.component";
import { Button } from "./button.component";
import type { SendOtpResponse } from "@/services/preapprove.service";

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  otpData: SendOtpResponse | null;
  phone: string;
  onResend?: (e?: React.SyntheticEvent) => void | Promise<void>;
  onConfirm?: (otpCode: string) => Promise<void>;
  otpInvalid?: boolean;
  onOtpInvalidReset?: () => void;
}

const OTP_LENGTH = 4;
const PHONE_MASK_RE = /(\+380)(\d{2})(\d{3})(\d{2})(\d{2})/;

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function OtpModal({
  open,
  onClose,
  otpData,
  phone,
  onResend,
  onConfirm,
  otpInvalid,
  onOtpInvalidReset,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isConfirming, setIsConfirming] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(
    otpData?.resend_available_in_seconds ?? 0,
  );
  const [prevOtpData, setPrevOtpData] = useState(otpData);

  if (prevOtpData !== otpData) {
    setPrevOtpData(otpData);
    setSecondsLeft(otpData?.resend_available_in_seconds ?? 0);
  }

  useEffect(() => {
    if (!otpData?.resend_available_in_seconds) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [otpData]);

  const handleInput = useCallback(
    (index: number, value: string) => {
      if (otpInvalid) onOtpInvalidReset?.();
      const digit = value.replace(/\D/g, "").slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otpInvalid, onOtpInvalidReset],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    setDigits((prev) => {
      const next = [...prev];
      pasted.split("").forEach((ch, i) => {
        next[i] = ch;
      });
      return next;
    });
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  const handleConfirm = useCallback(async () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) return;
    if (!onConfirm) return;
    setIsConfirming(true);
    try {
      await onConfirm(code);
    } finally {
      setIsConfirming(false);
    }
  }, [digits, onConfirm]);

  const maskedPhone = phone.replace(PHONE_MASK_RE, "$1 $2 $3 ** **");

  return (
    <Modal open={open} onClose={onClose}>
      <div className="otp-modal">
        <h3 className="otp-modal__title">Підтверди номер телефону</h3>
        <p className="otp-modal__subtitle">
          Ми надіслали код у SMS на номер {maskedPhone}
          <br />
          Введи його нижче
        </p>

        <div className="otp-modal__inputs" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              className={`otp-modal__input${otpInvalid ? " otp-modal__input--error" : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              autoFocus={i === 0}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Цифра ${i + 1}`}
            />
          ))}
        </div>
        {otpInvalid && (
          <p className="otp-modal__error">Неправильний код. Спробуй ще раз</p>
        )}

        {otpData && (
          <div className="otp-modal__resend">
            {secondsLeft > 0 ? (
              <span className="otp-modal__resend-text">
                Надіслати повторно через {formatTime(secondsLeft)}
              </span>
            ) : (
              <Button className="button--text" type="button" onClick={onResend}>
                Надіслати повторно
              </Button>
            )}
          </div>
        )}

        <Button
          type="button"
          disabled={digits.join("").length < OTP_LENGTH || isConfirming}
          onClick={handleConfirm}
        >
          Підтвердити
        </Button>
      </div>
    </Modal>
  );
}
