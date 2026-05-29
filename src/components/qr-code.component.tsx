interface QrCodeProps {
  src: string;
  alt?: string;
}

export function QrCode({ src, alt = "QR code" }: QrCodeProps) {
  return (
    <div className="qr-code">
      <img
        src={`${import.meta.env.VITE_ASSETS_BASE_URL}/qr-wrapper.png`}
        alt=""
        className="qr-code__wrapper"
        aria-hidden="true"
      />
      <img
        src={`${import.meta.env.VITE_ASSETS_BASE_URL}${src}`}
        alt={alt}
        className="qr-code__image"
      />
    </div>
  );
}
