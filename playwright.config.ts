import { defineConfig, devices } from "@playwright/test";

/** Felles Playwright-konfigurasjon for komponenttesting. */
const galleryUrl = "http://localhost:3178/playwright/gallery/index.html";

const galleryProjectUse = {
    ...devices["Desktop Chrome"],
    baseURL: galleryUrl,
    serviceWorkers: "block" as const,
    reuseContext: true,
    trace: "retain-on-failure" as const,
};

export default defineConfig({
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [["html", { open: "never" }]],
    projects: [
        {
            name: "components",
            testDir: ".",
            testMatch: "**/*.ct.spec.ts",
            use: galleryProjectUse,
        },
    ],
    webServer: {
        // Rydd opp eventuell hengende prosess.
        command:
            "lsof -ti tcp:3178 | xargs kill -9 2>/dev/null || true; node node_modules/vite/bin/vite.js --config playwright/vite.config.ts",
        cwd: "./apps/web",
        url: galleryUrl,
        reuseExistingServer: !process.env.CI,
    },
});
