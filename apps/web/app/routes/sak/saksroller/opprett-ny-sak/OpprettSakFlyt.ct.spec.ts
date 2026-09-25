import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import type { Innbygget } from "./OpprettSakFlyt.story";

const STORY = "routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt/Standard";

test("nullstiller rolle og underflyt når rolle, part, kategori eller sakstype endres", async ({ mount, page }) => {
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

    // Kategoribytte beholder sakstypen, men nullstiller person og flyt.
    await component.getByRole("radio", { name: "Utland" }).check();
    await expect(component.getByRole("radio", { name: /Barnebidrag/ })).toBeChecked();
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toHaveCount(0);

    await søkOgVelgPart();
    await component
        .getByRole("radiogroup", { name: /Hvilken rolle har/ })
        .getByRole("radio", { name: "Bidragspliktig" })
        .check();
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();

    await component.getByRole("radio", { name: /Ektefellebidrag/ }).check();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toBeVisible();
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toHaveCount(0);
    // Sakstypebytte setter kategorien tilbake til Nasjonal.
    await expect(component.getByRole("radio", { name: "Nasjonal" })).toBeChecked();
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
    const INNBYGGET = "routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt/Innbygget";
    const { bidragspliktig: bp, bidragsmottaker: bm, barnUnder18 } = testpersoner;
    const rollevelger = (component: import("@playwright/test").Locator) =>
        component.getByRole("radiogroup", { name: /Hvilken rolle har/ });

    test("inngang med BP forhåndsvelger person og rolle", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: bp.ident, rolle: "BP" });

        await expect(rollevelger(component).getByRole("radio", { name: "Bidragspliktig" })).toBeChecked();
        await expect(component.getByText(bp.visningsnavn).first()).toBeVisible();
    });

    test("inngang uten rolle lar saksbehandler velge rollen", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: bp.ident });

        await expect(rollevelger(component)).toBeVisible();
        await expect(rollevelger(component).getByRole("radio", { checked: true })).toHaveCount(0);
    });

    test("fullflyt fra barn: rolle ut fra alder, velger BP, oppretter og gir saksnummeret til kalleren", async ({
        mount,
        page,
    }) => {
        const requests = await mockWizardApi(page, { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } });
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: barnUnder18.ident, rolle: "BA" });

        await expect(rollevelger(component).getByRole("radio", { name: "Barn under 18 år" })).toBeChecked();
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
