import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import type { Locator } from "@playwright/test";
import type { Innbygget } from "./OpprettSakFlyt.story";

const STORY = "routes/sak/saksroller/opprett-ny-sak/start/OpprettSakFlyt/Standard";

async function velgStartpart(component: Locator, ident: string, rolle?: string) {
    const søk = component.getByRole("searchbox", { name: /^Søk etter/ }).first();
    await søk.fill(ident);
    await søk.press("Enter");
    if (rolle) {
        await component
            .getByRole("radiogroup", { name: /Hvilken rolle har/ })
            .getByRole("radio", { name: rolle })
            .check();
    }
    await component.getByRole("button", { name: "Bekreft" }).click();
}

test("Bekreft fyller ut skjemaet og tømmer søket", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveValue("");
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
    await expect(component.getByRole("button", { name: "Bekreft" })).toHaveCount(0);
});

test("ny Bekreft med utfylt skjema spør før skjemaet nullstilles", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    await velgStartpart(component, testpersoner.bidragsmottaker.ident, "Bidragsmottaker");
    const dialog = page.getByRole("alertdialog", { name: "Er du sikker?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Avbryt" }).click();
    await expect(dialog).toBeHidden();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();

    await component.getByRole("button", { name: "Bekreft" }).click();
    await dialog.getByRole("button", { name: "Ja, start på nytt" }).click();
    await expect(dialog).toBeHidden();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveValue("");
});

test("bytte av sakstype spør før skjemaet nullstilles", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);
    const barnOverskrift = component.getByRole("heading", { name: "Velg barn saken gjelder for" });
    const dialog = page.getByRole("alertdialog", { name: "Er du sikker?" });

    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");
    await expect(barnOverskrift).toBeVisible();

    await component.getByRole("radio", { name: /Ektefellebidrag/ }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Avbryt" }).click();
    await expect(dialog).toBeHidden();
    await expect(component.getByRole("radio", { name: /Barnebidrag/ })).toBeChecked();
    await expect(barnOverskrift).toBeVisible();

    await component.getByRole("radio", { name: /Ektefellebidrag/ }).click();
    await dialog.getByRole("button", { name: "Ja, start på nytt" }).click();
    await expect(component.getByRole("radio", { name: /Ektefellebidrag/ })).toBeChecked();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toBeVisible();
    await expect(barnOverskrift).toHaveCount(0);
});

test("kategori velges i skjemaet uten å nullstille det", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);
    const oppsummering = component
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: "Oppsummering" }) });

    await expect(component.getByRole("radio", { name: "Utland" })).toHaveCount(0);
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");
    await expect(component.getByRole("radio", { name: "Nasjonal" })).toBeChecked();

    await component.getByRole("radio", { name: "Utland" }).check();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();
    await expect(oppsummering.getByText("Utland", { exact: true })).toBeVisible();
});

test("bytte av sakstype uten utfylt skjema skjer uten dialog", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    await component.getByRole("radio", { name: /Ektefellebidrag/ }).check();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(component.getByRole("radio", { name: /Ektefellebidrag/ })).toBeChecked();
});

test("viser varsel når forslag til barn ikke kan hentes", async ({ mount, page }) => {
    await mockWizardApi(page);
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({ status: 500, json: { error: "Unavailable" } });
    });
    const component = await mount(STORY);

    await component.getByRole("radio", { name: /Farskap/ }).check();
    await velgStartpart(component, testpersoner.bidragsmottaker.ident);

    await expect(component.getByText("Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.")).toBeVisible();
    await component.getByRole("radio", { name: /Barnebidrag/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Ja, start på nytt" }).click();
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

    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

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
    expect(requests.create).toMatchObject({
        eierfogd: "4806",
        kategori: "N",
        arbeidsfordeling: "EFS",
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
    });
    expect(requests.create?.roller).toEqual([
        expect.objectContaining({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP" }),
        expect.objectContaining({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM" }),
    ]);
    await expect
        .poll(() => page.evaluate(() => (window as unknown as { __sammeDokument?: boolean }).__sammeDokument))
        .toBe(true);
});

test.describe("Innbygget med forhåndsutfylling", () => {
    const INNBYGGET = "routes/sak/saksroller/opprett-ny-sak/start/OpprettSakFlyt/Innbygget";
    const { bidragspliktig: bp, bidragsmottaker: bm, barnUnder18 } = testpersoner;
    const rollevelger = (component: import("@playwright/test").Locator) =>
        component.getByRole("radiogroup", { name: /Hvilken rolle har/ });

    test("inngang med BP fyller ut skjemaet uten Bekreft", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: bp.ident, rolle: "BP" });

        await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
        await expect(component.getByText(bp.visningsnavn).first()).toBeVisible();
        await expect(rollevelger(component)).toHaveCount(0);
    });

    test("viser ikke sakstype eller søk, og personen modalen åpnes for kan ikke endres", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: bp.ident, rolle: "BP" });
        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });

        await expect(bpKort.getByText(bp.visningsnavn).first()).toBeVisible();
        await expect(component.getByRole("radio", { name: /Ektefellebidrag/ })).toHaveCount(0);
        await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
        await expect(bpKort.getByRole("button", { name: "Endre bidragspliktig" })).toHaveCount(0);
        await expect(component.getByRole("radio", { name: "Nasjonal" })).toBeChecked();
        await expectNoAxeViolations(page, component);
    });

    test("barnet modalen åpnes for kan ikke velges bort", async ({ mount, page }) => {
        await mockWizardApi(page, { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } });
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: barnUnder18.ident, rolle: "BA" });
        const barn = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });

        await expect(barn).toBeChecked();
        await barn.click({ force: true });
        await expect(barn).toBeChecked();
    });

    test("inngang uten rolle lar saksbehandler velge rollen", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: bp.ident });

        await expect(rollevelger(component)).toBeVisible();
        await expect(rollevelger(component).getByRole("radio", { checked: true })).toHaveCount(0);
        await expect(component.getByRole("button", { name: "Bekreft" })).toBeDisabled();
        await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);

        await rollevelger(component).getByRole("radio", { name: "Bidragsmottaker" }).check();
        await component.getByRole("button", { name: "Bekreft" }).click();
        await expect(
            component.getByRole("group", { name: "Bidragsmottaker" }).getByText(bp.visningsnavn).first(),
        ).toBeVisible();
        await expect(rollevelger(component)).toHaveCount(0);
    });

    test("fullflyt fra barn: rolle ut fra alder, velger BP, oppretter og gir saksnummeret til kalleren", async ({
        mount,
        page,
    }) => {
        const requests = await mockWizardApi(page, { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } });
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: barnUnder18.ident, rolle: "BA" });

        await expect(rollevelger(component)).toHaveCount(0);
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("button", { name: `Bruk ${bp.visningsnavn}` })
            .click();

        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();
        expect(requests.create).toMatchObject({ eierfogd: "4806", kategori: "N", arbeidsfordeling: "EEN" });
        expect(requests.create?.roller).toEqual([
            expect.objectContaining({ fodselsnummer: bp.ident, type: "BP" }),
            expect.objectContaining({ fodselsnummer: bm.ident, type: "BM" }),
            expect.objectContaining({ fodselsnummer: barnUnder18.ident, type: "BA" }),
        ]);
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
        await expect(component.getByTestId("avbrutt")).toHaveValue("false");
    });

    test("Avbryt kaller onAvbryt", async ({ mount, page }) => {
        await mockWizardApi(page, { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } });
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: barnUnder18.ident, rolle: "BA" });

        await component.getByRole("button", { name: "Avbryt" }).click();
        await expect(component.getByTestId("avbrutt")).toHaveValue("true");
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("");
    });
});
