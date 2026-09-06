import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [svelte(), svelteTesting()],
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/all.*.test.ts"],
        },
      },
      {
        plugins: [svelte()],
        optimizeDeps: { include: ["@testing-library/svelte"] },
        test: {
          name: "data-render",
          include: ["src/all.*.test.ts"],
          provide: {
            testOnly: process.env.TEST_ONLY ?? "",
            dumpPages: Boolean(process.env.DUMP_PAGES),
          },
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
