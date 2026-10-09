import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { expectNoAxeViolations, mockOpprettSakApi } from "../../../../playwright/opprett-ny-sak/network";

const STORY = "opprett-ny-sak/flyt/ektefellebidrag/Ektefellebidrag/MedForslag";

test("viser ektefelle og partner som valg i stedet for forelder", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
    const velgPartner = bmKort.getByRole("combobox", { name: "Velg bidragsmottaker" });

    await expect(velgPartner.getByRole("option", { name: "Velg ektefelle eller partner" })).toHaveCount(1);
    await expect(velgPartner.getByRole("option", { name: "Velg forelder" })).toHaveCount(0);
});

test("velger og endrer foreslått ektefelle", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    const velgPartner = component.getByRole("combobox", { name: "Velg bidragsmottaker" });

    await velgPartner.selectOption({ label: "Test Ektefelle" });
    const endrePartner = component.getByRole("button", { name: "Endre bidragsmottaker" });
    await expect(component.getByRole("heading", { name: "Bidragsmottaker og bidragspliktig" })).toBeVisible();
    const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
    await expect(bmKort.getByText("Test Ukjent Person", { exact: true })).toBeVisible();
    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();

    await endrePartner.click();
    await expect(velgPartner.getByRole("option", { name: "Test Ektefelle" })).toHaveCount(1);
    await expect(bmKort.getByRole("paragraph").filter({ hasText: /^Velg bidragsmottaker$/ })).toBeVisible();
    await expectNoAxeViolations(page, component);
});

test("fjerner opprettelsesfeil når partene endres", async ({ mount, page }) => {
    await mockOpprettSakApi(page, { createStatus: 500, createBody: "Kunne ikke opprette sak" });
    const component = await mount(STORY);

    await component.getByRole("combobox", { name: "Velg bidragsmottaker" }).selectOption({ label: "Test Ektefelle" });
    await component.getByRole("button", { name: /Opprett$/ }).click();
    await expect(component.getByText("Kunne ikke opprette sak")).toBeVisible();

    await component.getByRole("button", { name: "Endre bidragsmottaker" }).click();
    await expect(component.getByText("Kunne ikke opprette sak")).toHaveCount(0);
});

test("bidragspliktig det ble startet fra kan endres", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    const bpKort = component.getByRole("group", { name: "Bidragspliktig" });

    await bpKort.getByRole("button", { name: "Endre bidragspliktig" }).click();
    await expect(bpKort.getByRole("paragraph").filter({ hasText: /^Velg bidragspliktig$/ })).toBeVisible();
    await expect(bpKort.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    await expectNoAxeViolations(page, component);
});
