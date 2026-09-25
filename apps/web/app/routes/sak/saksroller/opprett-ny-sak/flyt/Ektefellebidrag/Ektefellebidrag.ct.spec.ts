import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Ektefellebidrag/Ektefellebidrag/MedForslag";

test("velger og endrer foreslått ektefelle", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);
    const brukPartner = component.getByRole("button", { name: "Bruk Test Ektefelle" });

    await brukPartner.click();
    const endrePartner = component.getByRole("button", { name: "Endre bidragsmottaker" });
    await expect(
        component.getByRole("heading", { name: "Kontroller bidragspliktig og bidragsmottaker" }),
    ).toBeVisible();
    const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
    await expect(bmKort.getByText("Test Ukjent Person", { exact: true })).toBeVisible();
    await expect(component.getByRole("heading", { name: "Oppsummering" })).toBeVisible();
    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();

    await endrePartner.click();
    await expect(component.getByRole("button", { name: "Bruk Test Ektefelle" })).toBeVisible();
    await expect(bmKort.getByText("Ikke valgt")).toBeVisible();
    await expectNoAxeViolations(page, component);
});

test("fjerner opprettelsesfeil når partene endres", async ({ mount, page }) => {
    await mockWizardApi(page, { createStatus: 500, createBody: "Kunne ikke opprette sak" });
    const component = await mount(STORY);

    await component.getByRole("button", { name: "Bruk Test Ektefelle" }).click();
    await component.getByRole("button", { name: /Opprett$/ }).click();
    await expect(component.getByText("Kunne ikke opprette sak")).toBeVisible();

    await component.getByRole("button", { name: "Endre bidragsmottaker" }).click();
    await expect(component.getByText("Kunne ikke opprette sak")).toHaveCount(0);
});

test("bidragspliktig det ble startet fra kan endres", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);
    const bpKort = component.getByRole("group", { name: "Bidragspliktig" });

    await bpKort.getByRole("button", { name: "Endre bidragspliktig" }).click();
    await expect(bpKort.getByText("Ikke valgt")).toBeVisible();
    await expect(bpKort.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    await expectNoAxeViolations(page, component);
});
