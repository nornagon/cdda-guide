import App from "./App.svelte";
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";
import "@fontsource/unifont";

if (location.hostname !== "localhost")
  Sentry.init({
    dsn: "https://e7e132477a2844118b8f6d045a507e10@o318291.ingest.sentry.io/5665093",
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.2,
  });

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch((err) => {
    console.log("ServiceWorker registration failed: ", err);
  });
  navigator.serviceWorker.ready.then(start, start);
} else {
  start();
}

function start() {
  const app = new App({
    target: document.body,
  });
}

//export default app;
