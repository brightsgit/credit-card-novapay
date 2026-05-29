import { Modal } from "./modal.component";
import { QrCode } from "./qr-code.component";

const SpinnerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    className="result-modal__spinner"
  >
    <mask
      id="mask0_4_5750"
      style={{ maskType: "alpha" }}
      maskUnits="userSpaceOnUse"
      x="0"
      y="1"
      width="32"
      height="31"
    >
      <g clipPath="url(#paint0_angular_4_5750_clip_path)">
        <g transform="matrix(0.001 -0.011 -0.011 -0.001 15.9961 16.0068)">
          <foreignObject
            x="-2233.51"
            y="-2233.51"
            width="4467.01"
            height="4467.01"
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                background:
                  "conic-gradient(from 90deg,rgba(33, 129, 212, 1) 0deg,rgba(33, 129, 212, 0.2) 360deg)",
                height: "100%",
                width: "100%",
                opacity: 1,
              }}
            />
          </foreignObject>
        </g>
      </g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.5822 21.1353C20.7501 25.3264 15.0568 26.4281 10.8657 23.5961C6.67456 20.764 5.57282 15.0707 8.40487 10.8796C9.79333 8.82479 11.8634 7.51469 14.116 7.04318C15.7377 6.70373 16.7772 5.1139 16.4377 3.49219C16.0983 1.87048 14.5084 0.831005 12.8867 1.17045C9.16909 1.94861 5.72984 4.12185 3.43345 7.52024C-1.25389 14.457 0.569599 23.8802 7.50633 28.5675C14.4431 33.2548 23.8662 31.4314 28.5536 24.4946C33.2409 17.5579 31.4174 8.1347 24.4807 3.44736C23.1079 2.51971 21.243 2.88058 20.3153 4.2534C19.3877 5.62622 19.7486 7.49112 21.1214 8.41877C25.3125 11.2508 26.4142 16.9442 23.5822 21.1353Z"
      />
    </mask>
    <g mask="url(#mask0_4_5750)">
      <g clipPath="url(#paint1_angular_4_5750_clip_path)">
        <g transform="matrix(-4.08897e-05 -0.0131243 -0.0131243 4.08897e-05 17.0266 16.4423)">
          <foreignObject
            x="-2011.61"
            y="-2011.61"
            width="4023.22"
            height="4023.22"
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                background:
                  "conic-gradient(from 90deg,rgba(105, 13, 211, 1) 0deg,rgba(105, 13, 211, 0.1) 360deg)",
                height: "100%",
                width: "100%",
                opacity: 1,
              }}
            />
          </foreignObject>
        </g>
      </g>
      <circle
        cx="16"
        cy="16"
        r="16"
        transform="matrix(0.759918 -0.650019 -0.650019 -0.759918 14.2383 38.5664)"
      />
    </g>
    <defs>
      <clipPath id="paint0_angular_4_5750_clip_path">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23.5822 21.1353C20.7501 25.3264 15.0568 26.4281 10.8657 23.5961C6.67456 20.764 5.57282 15.0707 8.40487 10.8796C9.79333 8.82479 11.8634 7.51469 14.116 7.04318C15.7377 6.70373 16.7772 5.1139 16.4377 3.49219C16.0983 1.87048 14.5084 0.831005 12.8867 1.17045C9.16909 1.94861 5.72984 4.12185 3.43345 7.52024C-1.25389 14.457 0.569599 23.8802 7.50633 28.5675C14.4431 33.2548 23.8662 31.4314 28.5536 24.4946C33.2409 17.5579 31.4174 8.1347 24.4807 3.44736C23.1079 2.51971 21.243 2.88058 20.3153 4.2534C19.3877 5.62622 19.7486 7.49112 21.1214 8.41877C25.3125 11.2508 26.4142 16.9442 23.5822 21.1353Z"
        />
      </clipPath>
      <clipPath id="paint1_angular_4_5750_clip_path">
        <circle
          cx="16"
          cy="16"
          r="16"
          transform="matrix(0.759918 -0.650019 -0.650019 -0.759918 14.2383 38.5664)"
        />
      </clipPath>
    </defs>
  </svg>
);

interface ResultModalProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  title?: string;
  body?: string;
  bodyMobile?: string;
  qrSrc?: string;
  buttonLabel?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
}

export function ResultModal({
  open,
  onClose,
  loading = false,
  title,
  body,
  bodyMobile,
  qrSrc,
  buttonLabel,
  buttonHref,
  onButtonClick,
}: ResultModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="result-modal">
        {loading ? (
          <SpinnerIcon />
        ) : (
          <>
            {title && <h3 className="result-modal__title">{title}</h3>}
            {body && (
              <p
                className={`result-modal__body${bodyMobile ? " result-modal__body--desktop" : ""}`}
              >
                {body}
              </p>
            )}
            {bodyMobile && (
              <p className="result-modal__body result-modal__body--mobile">
                {bodyMobile}
              </p>
            )}
            {qrSrc && (
              <div className="result-modal__qr">
                <QrCode src={qrSrc} />
              </div>
            )}
            {buttonLabel && buttonHref && (
              <a
                href={buttonHref}
                className="result-modal__link button"
                target="_blank"
                rel="noopener noreferrer"
              >
                {buttonLabel}
              </a>
            )}
            {buttonLabel && onButtonClick && (
              <button
                type="button"
                className="result-modal__button button"
                onClick={onButtonClick}
              >
                {buttonLabel}
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
