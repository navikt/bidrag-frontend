import { test as base, expect } from "@playwright/test";

type AutomaticFixtures = {
    pageErrorMonitor: undefined;
};

export const test = base.extend<AutomaticFixtures>({
    pageErrorMonitor: [
        async ({ page }, use) => {
            const errors: string[] = [];
            page.on("pageerror", (error) => errors.push(error.name));

            await use(undefined);

            expect(errors, `Siden fikk ${errors.length} ukontrollerte JavaScript-feil.`).toEqual([]);
        },
        { auto: true },
    ],
});

export { expect };
