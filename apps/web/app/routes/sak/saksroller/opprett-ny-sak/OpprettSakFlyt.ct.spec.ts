import { expect, test } from "@playwright/test";
import { testpersoner } from "./playwright/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "./playwright/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt/Standard";

test("endrer sakstype, søker person via nettverk og endrer valgt part", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    await expect(component.getByText("Barnebidrag", { exact: true })).toBeVisible();
    await component.getByRole("button", { name: "Endre" }).click();
    await component.getByRole("radio", { name: /Ektefellebidrag/ }).dispatchEvent("click");

    const search = component.getByRole("searchbox", { name: "Søk etter part" });
    await search.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");

    await expect(component.getByRole("button", { name: "Endre part" })).toBeVisible();
    await component.getByRole("button", { name: "Endre part" }).click();
    await expect(component.getByRole("searchbox", { name: "Søk etter part" })).toBeVisible();
});

test("hele siden: velger sakstype, søker part, fyller ut motpart og oppretter ektefellebidragssak", async ({
    mount,
    page,
}) => {
    const requests = await mockWizardApi(page);
    const component = await mount(STORY);

    // Startbilde: sakstype allerede forhåndsvalgt til Barnebidrag av story-oppsettet
    await expect(component.getByText("Barnebidrag", { exact: true })).toBeVisible();
    await expectNoAxeViolations(page, component);

    await component.getByRole("button", { name: "Endre" }).click();
    await component.getByRole("radio", { name: /Ektefellebidrag/ }).dispatchEvent("click");

    const search = component.getByRole("searchbox", { name: "Søk etter part" });
    await search.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");
    await expect(component.getByRole("button", { name: "Endre part" })).toBeVisible();

    await component.getByRole("combobox", { name: /Hvilken rolle har/ }).selectOption("bidragspliktig");

    await component.getByRole("button", { name: "Søk etter annen person" }).click();
    const motpartSøk = component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" });
    await motpartSøk.fill(testpersoner.bidragsmottaker.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");
    await expect(component.getByText(testpersoner.bidragsmottaker.visningsnavn).first()).toBeVisible();

    // Oppsummeringstilstand: begge parter valgt, klar til innsending
    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();
    await expectNoAxeViolations(page, component);

    await component.getByRole("button", { name: /Opprett$/ }).click();

    await expect.poll(() => requests.create).toBeTruthy();
    expect(requests.create?.roller).toHaveLength(2);
    // Klikk på "Opprett" uten valgt redirect-mål navigerer via window.location til saksnummer-URL-en (reell app-oppførsel, ikke en test-feil)
    await page.waitForURL(/saksnummer=1234567/);
});
