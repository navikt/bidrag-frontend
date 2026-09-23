import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ pauseAfterTest: undefined }>({
    pauseAfterTest: [
        async ({ page }, use, testInfo) => {
            await use(undefined);
            if (testInfo.project.name === "components-slow") {
                await page.waitForTimeout(1000);
            }
        },
        { auto: true },
    ],
});

export { expect };
