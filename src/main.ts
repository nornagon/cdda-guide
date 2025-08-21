import App from "./App.svelte";
import * as Sentry from "@sentry/svelte";
import "@fontsource/unifont";
import { registerSW } from "virtual:pwa-register";
import { tx } from "@transifex/native";
import { mount } from "svelte";

tx.init({
  token: "1/1d8c1f9e14b4c21d70dd3f6fccdd0ab16b691105",
});

if (location.hostname !== "localhost")
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    ...(process.env.GITHUB_SHA && {
      release: `cdda-guide@${process.env.GITHUB_SHA.slice(0, 8)}`,
    }),
  });

registerSW({});

if (location.hash) {
  history.replaceState(
    null,
    "",
    import.meta.env.BASE_URL + location.hash.slice(2) + location.search,
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
  mount(App, {
    target: document.body,
  });
}
