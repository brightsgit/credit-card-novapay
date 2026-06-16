import { useLayoutEffect, useRef, useState } from "react";

const PREFIX = "+380 ";

function formatPhone(digits: string): string {
  const d = digits.slice(0, 9);
  if (d.length === 0) return "";
  let result = "";
  if (d.length > 0) result += d.slice(0, 2);
  if (d.length > 2) result += " " + d.slice(2, 5);
  if (d.length > 5) result += " " + d.slice(5, 7);
  if (d.length > 7) result += " " + d.slice(7, 9);
  return PREFIX + result;
}

function extractDigits(value: string): string {
  return value.slice(PREFIX.length).replace(/\D/g, "");
}

// Cursor position in display string → digit index (after prefix)
function cursorToDigitIndex(cursor: number, display: string): number {
  if (cursor <= PREFIX.length) return 0;
  return display.slice(PREFIX.length, cursor).replace(/\D/g, "").length;
}

// Digit index → cursor position in display string
function digitIndexToCursor(digitIdx: number, display: string): number {
  const suffix = display.slice(PREFIX.length);
  let count = 0;
  let i = 0;
  while (i < suffix.length && count < digitIdx) {
    if (/\d/.test(suffix[i])) count++;
    i++;
  }
  return PREFIX.length + i;
}

type PhoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
};

export function PhoneField({
  value,
  onChange,
  onBlur,
  error,
}: PhoneFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextCursorPos = useRef<number | null>(null);
  const [showPrefix, setShowPrefix] = useState(false);

  const digits = extractDigits(value || "");
  const displayValue = showPrefix && !digits ? PREFIX : formatPhone(digits);

  useLayoutEffect(() => {
    if (nextCursorPos.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(
        nextCursorPos.current,
        nextCursorPos.current,
      );
      nextCursorPos.current = null;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawCursor = input.selectionStart ?? input.value.length;

    // Digits typed before cursor in new raw value (strip prefix/spaces)
    const rawBeforeCursor = input.value
      .slice(0, rawCursor)
      .replace(/\D/g, "")
      .replace(/^380/, "");
    const allDigits = input.value
      .replace(/\D/g, "")
      .replace(/^380/, "")
      .slice(0, 9);

    const newDisplay = formatPhone(allDigits);
    onChange(newDisplay);
    nextCursorPos.current = digitIndexToCursor(
      rawBeforeCursor.length,
      newDisplay,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    const selStart = input.selectionStart ?? displayValue.length;
    const selEnd = input.selectionEnd ?? displayValue.length;
    const digits = extractDigits(displayValue);
    const hasSelection = selStart !== selEnd;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (hasSelection) {
        const from = cursorToDigitIndex(selStart, displayValue);
        const to = cursorToDigitIndex(selEnd, displayValue);
        const newDigits = digits.slice(0, from) + digits.slice(to);
        const newDisplay = formatPhone(newDigits);
        onChange(newDisplay);
        nextCursorPos.current = digitIndexToCursor(from, newDisplay);
      } else {
        const idx = cursorToDigitIndex(selStart, displayValue);
        if (idx <= 0) return;
        const newDigits = digits.slice(0, idx - 1) + digits.slice(idx);
        const newDisplay = formatPhone(newDigits);
        onChange(newDisplay);
        nextCursorPos.current = digitIndexToCursor(idx - 1, newDisplay);
      }
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      if (hasSelection) {
        const from = cursorToDigitIndex(selStart, displayValue);
        const to = cursorToDigitIndex(selEnd, displayValue);
        const newDigits = digits.slice(0, from) + digits.slice(to);
        const newDisplay = formatPhone(newDigits);
        onChange(newDisplay);
        nextCursorPos.current = digitIndexToCursor(from, newDisplay);
      } else {
        const idx = cursorToDigitIndex(selStart, displayValue);
        if (idx >= digits.length) return;
        const newDigits = digits.slice(0, idx) + digits.slice(idx + 1);
        const newDisplay = formatPhone(newDigits);
        onChange(newDisplay);
        nextCursorPos.current = digitIndexToCursor(idx, newDisplay);
      }
      return;
    }
  };

  const handleClick = () => {
    const input = inputRef.current;
    if (!input || !displayValue) return;
    const pos = Math.max(input.selectionStart ?? 0, PREFIX.length);
    input.setSelectionRange(pos, pos);
  };

  const handleFocus = () => {
    if (!digits) {
      setShowPrefix(true);
      nextCursorPos.current = PREFIX.length;
      return;
    }
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      const pos = Math.max(input.selectionStart ?? 0, PREFIX.length);
      input.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="field">
      <input
        ref={inputRef}
        type="tel"
        inputMode="tel"
        placeholder="+380 00 000 00 00"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        onBlur={() => {
          setShowPrefix(false);
          onBlur?.();
        }}
        className={`field__input${error ? " field__input--error" : ""}`}
      />
      <span className="field__error">{error}</span>
    </div>
  );
}
