import { createRoot } from "react-dom/client";
import App from "./App";
import css from "./styles/main.scss?inline";
import {
  captureCampaignParams,
  loadSmartScript,
} from "./services/appsflyer.service";
import { initTikTokPixel } from "@/utils/track.util";

// Capture AppsFlyer/UTM params from this page's URL and warm up the Smart Script
// so the OneLink is ready by the time the user reaches the result screen.
captureCampaignParams();
void loadSmartScript();

function mountWidget(hostSelector: string) {
  const host = document.querySelector(hostSelector) ?? document.body;

  initTikTokPixel();

  const shadow = host.attachShadow({ mode: "open" });

  if (!document.querySelector("link[data-novapay-font]")) {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Geologica:wght@100..900&display=swap";
    fontLink.dataset.novapayFont = "";
    document.head.appendChild(fontLink);
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  shadow.adoptedStyleSheets = [sheet];

  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  createRoot(mountPoint).render(<App />);
}

mountWidget("#root");
