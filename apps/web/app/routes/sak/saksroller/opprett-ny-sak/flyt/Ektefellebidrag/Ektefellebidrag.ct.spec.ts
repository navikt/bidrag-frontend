import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Ektefellebidrag/Ektefellebidrag/MedForslag";

test("velger og endrer foreslått ektefelle", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);
    const brukPartner = component.getByRole("button", { name: "Bruk Test Ektefelle" });

    await brukPartner.click();
    const fjernPartner = component.getByRole("button", { name: "Fjern Test Ektefelle" });
    await expect(fjernPartner).toHaveAttribute("aria-pressed", "true");
    await expect(component.getByRole("heading", { name: "Parter" })).toBeVisible();
    await expect(component.getByText("Test Ukjent Person", { exact: true })).toHaveCount(2);
    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();

    await fjernPartner.click();
    await expect(component.getByRole("button", { name: "Bruk Test Ektefelle" })).toHaveAttribute(
        "aria-pressed",
        "false",
    );
    await expect(component.getByText("Test Ukjent Person", { exact: true })).toHaveCount(1);
    await expectNoAxeViolations(page, component);
});

test("fjerner opprettelsesfeil når partene endres", async ({ mount, page }) => {
    await mockWizardApi(page, { createStatus: 500, createBody: "Kunne ikke opprette sak" });
    const component = await mount(STORY);

    await component.getByRole("button", { name: "Bruk Test Ektefelle" }).click();
    await component.getByRole("button", { name: /Opprett$/ }).click();
    await expect(component.getByText("Kunne ikke opprette sak")).toBeVisible();

    await component.getByRole("button", { name: "Fjern Test Ektefelle" }).click();
    await expect(component.getByText("Kunne ikke opprette sak")).toHaveCount(0);
});
