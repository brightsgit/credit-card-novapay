import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="#767F8A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function getShadowRoot(): Element {
  const host = document.querySelector("#root") ?? document.body;
  const shadow = host.shadowRoot;
  return (shadow?.firstElementChild as Element) ?? document.body;
}

export function Modal({ open, onClose, children }: ModalProps) {
  const [portalTarget] = useState<Element | null>(getShadowRoot);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: Event) => {
      if ((e as KeyboardEvent).key === "Escape") onClose();
    };
    const root = (document.querySelector("#root")?.shadowRoot ??
      document) as EventTarget;
    root.addEventListener("keydown", handleKey);
    return () => root.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !portalTarget) return null;

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__content">
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Закрити"
          >
            <CloseIcon />
          </button>
          {children}
        </div>
      </div>
    </>,
    portalTarget,
  );
}
