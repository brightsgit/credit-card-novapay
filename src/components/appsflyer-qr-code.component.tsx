import { useEffect, useRef } from "react";
import { renderQrCode } from "@/services/appsflyer.service";

type AppsFlyerQrCodeProps = {
  url: string;
};

export function AppsFlyerQrCode({ url }: AppsFlyerQrCodeProps) {
  const canvasHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasHost.current) renderQrCode(canvasHost.current);
  }, [url]);

  return (
    <div className="qr-code">
      <img
        src={`${import.meta.env.VITE_ASSETS_BASE_URL}/qr-wrapper.png`}
        alt=""
        className="qr-code__wrapper"
        aria-hidden="true"
      />
      <div ref={canvasHost} className="qr-code__image" />
    </div>
  );
}
