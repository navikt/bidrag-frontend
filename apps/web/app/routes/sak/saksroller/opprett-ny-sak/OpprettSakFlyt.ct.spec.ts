import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt/Standard";

test("velger ny sakstype og part direkte i de faste valgpanelene", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    await expect(component.getByRole("radio", { name: /Barnebidrag/ })).toBeChecked();
    await component.getByRole("radio", { name: /Ektefellebidrag/ }).check();

    const search = component.getByRole("searchbox", { name: "Søk etter part" });
    await search.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");

    await expect(search).toBeVisible();
    await expect(component.getByText(testpersoner.bidragspliktig.visningsnavn).first()).toBeVisible();
});

test("nullstiller rolle og underflyt når rolle, part eller sakstype endres", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    const søkOgVelgPart = async () => {
        const search = component.getByRole("searchbox", { name: "Søk etter part" });
        await search.fill(testpersoner.bidragspliktig.ident);
        await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");
    };

    await søkOgVelgPart();
    const rolleVelger = component.getByRole("combobox", { name: /Hvilken rolle har/ });
    await rolleVelger.selectOption("bidragspliktig");
    await expect(component.getByRole("heading", { name: "Legg til barn" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();

    await rolleVelger.selectOption("bidragsmottaker");
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    const partSøk = component.getByRole("searchbox", { name: "Søk etter part" });
    await partSøk.fill(testpersoner.bidragsmottaker.ident);
    await partSøk.press("Enter");
    await expect(component.getByRole("heading", { name: "Legg til barn" })).toBeHidden();

    const nyRolleVelger = component.getByRole("combobox", { name: /Hvilken rolle har/ });
    await expect(nyRolleVelger).toHaveValue("");
    await nyRolleVelger.selectOption("bidragspliktig");
    await expect(component.getByRole("heading", { name: "Legg til barn" })).toBeVisible();

    await component.getByRole("radio", { name: /Ektefellebidrag/ }).check();
    await expect(component.getByRole("combobox", { name: /Hvilken rolle har/ })).toHaveValue("");
    await expect(component.getByRole("heading", { name: "Legg til barn" })).toBeHidden();
});

test("hele siden: velger sakstype, søker part, fyller ut motpart og oppretter ektefellebidragssak", async ({
    mount,
    page,
}) => {
    const requests = await mockWizardApi(page);
    const component = await mount(STORY);

    await expect(component.getByRole("radio", { name: /Barnebidrag/ })).toBeChecked();
    await expectNoAxeViolations(page, component);

    await component.getByRole("radio", { name: /Ektefellebidrag/ }).check();

    const search = component.getByRole("searchbox", { name: "Søk etter part" });
    await search.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");
    await expect(search).toBeVisible();

    await component.getByRole("combobox", { name: /Hvilken rolle har/ }).selectOption("bidragspliktig");

    const motpartSøk = component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" });
    await motpartSøk.fill(testpersoner.bidragsmottaker.ident);
    await motpartSøk.press("Enter");
    await expect(component.getByText(testpersoner.bidragsmottaker.visningsnavn).first()).toBeVisible();

    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();
    await expectNoAxeViolations(page, component);

    await page.evaluate(() => {
        (window as unknown as { __sammeDokument?: boolean }).__sammeDokument = true;
    });

    await component.getByRole("button", { name: /Opprett$/ }).click();

    await expect.poll(() => requests.create).toBeTruthy();
    expect(requests.create?.roller).toHaveLength(2);
    await expect
        .poll(() => page.evaluate(() => (window as unknown as { __sammeDokument?: boolean }).__sammeDokument))
        .toBe(true);
});
