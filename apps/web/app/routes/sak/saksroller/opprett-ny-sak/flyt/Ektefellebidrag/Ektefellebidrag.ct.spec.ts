import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Ektefellebidrag/Ektefellebidrag/MedForslag";

test("velger og endrer foreslått ektefelle", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);
    const partner = component
        .getByRole("button")
        .filter({ hasText: /Test Ukjent Person/ })
        .first();

    await partner.click();
    await expect(component.getByRole("heading", { name: "Oppsummering" })).toBeVisible();
    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();

    await partner.click();
    await expect(component.getByRole("heading", { name: "Oppsummering" })).toHaveCount(0);
    await expectNoAxeViolations(page, component);
});
