import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, mockWizardApi } from "../../playwright/network";

const INGEN =
    "routes/sak/saksroller/opprett-ny-sak/flyt/BarnManglendeForeldre/BarnManglendeForeldre/IngenKjenteForeldre";
const EN = "routes/sak/saksroller/opprett-ny-sak/flyt/BarnManglendeForeldre/BarnManglendeForeldre/EnKjentForelder";

test.describe("Barn med manglende foreldre", () => {
    test("viser registrering av begge foreldre og påkrevd reell mottaker", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(INGEN);

        await expect(component.getByText(/ingen registrerte foreldre/).first()).toBeVisible();
        await expect(component.getByRole("searchbox", { name: "Søk forelder #1" })).toBeVisible();
        await expect(component.getByRole("searchbox", { name: "Søk forelder #2" })).toBeVisible();
        await expectNoAxeViolations(page, component);
    });

    test("viser kjent forelder og lar manglende forelder settes ukjent", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(EN);

        await expect(component.getByText(/én forelder registrert/)).toBeVisible();
        await component.getByRole("button", { name: "Eller sett som ukjent" }).click();
        await expect(component.getByText("Ukjent", { exact: true })).toBeVisible();
    });
});
