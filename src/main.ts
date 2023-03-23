import App from "./App.svelte";
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";
import "@fontsource/unifont";
import { registerSW } from "virtual:pwa-register";
import { tx } from "@transifex/native";

tx.init({
  token: "1/1d8c1f9e14b4c21d70dd3f6fccdd0ab16b691105",
});

if (location.hostname !== "localhost")
  Sentry.init({
    dsn: "https://e7e132477a2844118b8f6d045a507e10@o318291.ingest.sentry.io/5665093",
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
    ...(process.env.GITHUB_SHA && {
      release: `cdda-guide@${process.env.GITHUB_SHA.slice(0, 8)}`,
    }),
    denyUrls: [
      // Chrome extensions
      /^chrome-extension:/,
      /cdda-guide.aloxaf.com\//,
    ],
  });

registerSW({});

if (location.hash) {
  history.replaceState(
    null,
    "",
    import.meta.env.BASE_URL + location.hash.slice(2) + location.search
  );
}

const url = new URL(location.href);
const locale = url.searchParams.get("lang");
if (locale) {
  tx.setCurrentLocale(locale).then(start, start);
} else {
  start();
}
function start() {
  new App({
    target: document.body,
  });
}
