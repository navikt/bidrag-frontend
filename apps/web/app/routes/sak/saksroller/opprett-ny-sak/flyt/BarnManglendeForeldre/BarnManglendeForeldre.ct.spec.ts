import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const INGEN =
    "routes/sak/saksroller/opprett-ny-sak/flyt/BarnManglendeForeldre/BarnManglendeForeldre/IngenKjenteForeldre";
const EN = "routes/sak/saksroller/opprett-ny-sak/flyt/BarnManglendeForeldre/BarnManglendeForeldre/EnKjentForelder";

test.describe("Barn med manglende foreldre", () => {
    test("viser registrering av begge foreldre og påkrevd reell mottaker", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(INGEN);

        await expect(component.getByText(/ingen registrerte foreldre/).first()).toBeVisible();
        await expect(component.getByRole("searchbox", { name: "Søk etter forelder 1" })).toBeVisible();
        await expect(component.getByRole("searchbox", { name: "Søk etter forelder 2" })).toBeVisible();
        await expect(component.getByRole("button", { name: "Registrer forelder 1 som ukjent" })).toBeVisible();
        await expect(component.getByRole("button", { name: "Registrer forelder 2 som ukjent" })).toBeVisible();
        await expect(component.getByRole("heading", { name: "Barn" })).toBeVisible();
        await expect(component.getByText("Velg roller for foreldrene før du velger reell mottaker.")).toBeVisible();
        const seksjonsoverskrifter = await component.getByRole("heading", { level: 2 }).allTextContents();
        expect(seksjonsoverskrifter.indexOf("Barn")).toBeLessThan(seksjonsoverskrifter.indexOf("Foreldre"));

        await expectNoAxeViolations(page, component);
    });

    test("viser kjent forelder og lar manglende forelder settes ukjent", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(EN);

        await expect(component.getByText(/én forelder registrert/)).toBeVisible();
        await component.getByRole("button", { name: "Registrer forelder 2 som ukjent" }).click();
        await expect(component.getByText("Ukjent", { exact: true })).toBeVisible();
        await expect(component.getByRole("searchbox", { name: "Søk etter forelder 2" })).toBeVisible();
    });
});
