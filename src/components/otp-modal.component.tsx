import { useRef, useState, useCallback } from "react";
import { Modal } from "./modal.component";
import { Button } from "./button.component";
import type { SendOtpResponse } from "@/services/preapprove.service";

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  otpData: SendOtpResponse | null;
  phone: string;
}

const OTP_LENGTH = 4;

export function OtpModal({ open, onClose, otpData, phone }: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

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

  const handleConfirm = useCallback(() => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) return;
    console.log("OTP confirm", code);
  }, [digits]);

  const maskedPhone = phone.replace(
    /(\+380)(\d{2})(\d{3})(\d{2})(\d{2})/,
    "$1 $2 $3 ** **",
  );

  return (
    <Modal open={open} onClose={onClose}>
      <div className="otp-modal">
        <h3 className="otp-modal__title">Введіть код з SMS</h3>
        <p className="otp-modal__subtitle">
          Ми надіслали код підтвердження на номер
          <br />
          <strong>{maskedPhone}</strong>
        </p>

        <div className="otp-modal__inputs" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              className="otp-modal__input"
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

        {otpData && (
          <p className="otp-modal__resend">
            Надіслати повторно через {otpData.resend_available_in_seconds} сек
          </p>
        )}

        <Button
          type="button"
          disabled={digits.join("").length < OTP_LENGTH}
          onClick={handleConfirm}
        >
          Підтвердити
        </Button>
      </div>
    </Modal>
  );
}
