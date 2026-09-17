import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { environment } from "./regresjon-test/config/environment.ts";

const authStatePath = resolve(import.meta.dirname, ".auth/user.json");

export default defineConfig({
    testDir: "./regresjon-test",
    testMatch: "**/*.spec.ts",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 1,
    expect: {
        timeout: 20_000,
    },
    reporter: [["list"],["junit",{outputFile:"playwright-report/junit.xml"}], ["html", { open: "never", outputFolder: "playwright-report" }]],
    outputDir: "test-results",
    use: {
        baseURL: environment.baseUrl,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "auth",
            testMatch: "**/setup/auth.setup.ts",
            use: {
                ...devices["Desktop Chrome"],
                trace: "off",
                screenshot: "off",
                video: "off",
            },
        },
        {
            name: "chromium",
            dependencies: ["auth"],
            testIgnore: "**/setup/**",
            use: {
                ...devices["Desktop Chrome"],
                storageState: authStatePath,
            },
        },
    ],
});
