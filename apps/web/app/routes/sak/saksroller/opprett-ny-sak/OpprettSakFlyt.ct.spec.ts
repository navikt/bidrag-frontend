import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt/Standard";

test("velger ny sakstype og part direkte i de faste valgpanelene", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    await expect(component.getByRole("radio", { name: /Barnebidrag/ })).toBeChecked();
    await expect(component.getByRole("radio", { name: "Nasjonal" })).toBeChecked();
    await component.getByRole("radio", { name: /Ektefellebidrag/ }).check();

    const search = component.getByRole("searchbox", { name: "Søk etter person" });
    await search.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");

    await expect(search).toBeVisible();
    await expect(component.getByText(testpersoner.bidragspliktig.visningsnavn).first()).toBeVisible();
});

test("nullstiller rolle og underflyt når rolle, part eller sakstype endres", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    const søkOgVelgPart = async () => {
        const search = component.getByRole("searchbox", { name: "Søk etter person" });
        await search.fill(testpersoner.bidragspliktig.ident);
        await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");
    };

    await søkOgVelgPart();
    await component
        .getByRole("radiogroup", { name: /Hvilken rolle har/ })
        .getByRole("radio", { name: "Bidragspliktig" })
        .check();
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();

    await component
        .getByRole("radiogroup", { name: /Hvilken rolle har/ })
        .getByRole("radio", { name: "Bidragsmottaker" })
        .check();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    const partSøk = component.getByRole("searchbox", { name: "Søk etter person" });
    await partSøk.fill(testpersoner.bidragsmottaker.ident);
    await partSøk.press("Enter");
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toHaveCount(0);

    const nyRolleVelger = component.getByRole("radiogroup", { name: /Hvilken rolle har/ });
    await expect(nyRolleVelger.getByRole("radio", { checked: true })).toHaveCount(0);
    await nyRolleVelger.getByRole("radio", { name: "Bidragspliktig" }).check();
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();

    await component.getByRole("radio", { name: /Ektefellebidrag/ }).check();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toBeVisible();
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toHaveCount(0);
    await expect(component.getByRole("radio", { name: "Nasjonal" })).toBeChecked();
});

test("beholder sakstype ved kategoribytte, men nullstiller person og flyt", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    const søk = component.getByRole("searchbox", { name: "Søk etter person" });
    await søk.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toBeVisible();
    await component
        .getByRole("radiogroup", { name: /Hvilken rolle har/ })
        .getByRole("radio", { name: "Bidragspliktig" })
        .check();
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();

    await component.getByRole("radio", { name: "Utland" }).check();
    await expect(component.getByRole("radio", { name: "Barnebidrag" })).toBeChecked();
    await expect(component.getByRole("radio", { name: "Utland" })).toBeChecked();
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toHaveCount(0);
});

test("viser varsel når forslag til barn ikke kan hentes", async ({ mount, page }) => {
    await mockWizardApi(page);
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({ status: 500, json: { error: "Unavailable" } });
    });
    const component = await mount(STORY);

    await component.getByRole("radio", { name: /Farskap/ }).check();
    await component
        .getByRole("searchbox", { name: "Søk etter bidragsmottaker" })
        .fill(testpersoner.bidragsmottaker.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");

    await expect(component.getByText("Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.")).toBeVisible();
    await component.getByRole("radio", { name: /Barnebidrag/ }).check();
    await expect(component.getByText("Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.")).toHaveCount(
        0,
    );
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

    const search = component.getByRole("searchbox", { name: "Søk etter person" });
    await search.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");
    await expect(search).toBeVisible();

    await component
        .getByRole("radiogroup", { name: /Hvilken rolle har/ })
        .getByRole("radio", { name: "Bidragspliktig" })
        .check();

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
