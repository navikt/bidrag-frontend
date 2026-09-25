import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Barnebidrag/Barnebidrag";
const { bidragspliktig: bp, bidragsmottaker: bm, annenForelder, barnUnder18 } = testpersoner;

/** Storyen genererer egne identer, så barnet i storyen får foreldrene uansett ident. */
async function barnetsForeldre(page: import("@playwright/test").Page, foreldre: string[]) {
    await page.route(/\/proxy\/bidrag-person\/forelderbarnrelasjon$/, async (route) => {
        await route.fulfill({
            json: {
                forelderBarnRelasjon: foreldre.map((relatertPersonsIdent) => ({
                    minRolleForPerson: "BARN",
                    relatertPersonsIdent,
                })),
            },
        });
    });
}

test.describe("Start fra forelder med barn", () => {
    test("bytter barnkurv, fyller ut motpart og oppretter sak", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        const component = await mount(`${STORY}/ForelderMedBarn`);
        const førsteBarn = component.getByRole("checkbox").first();
        const andreBarn = component.getByRole("checkbox").nth(1);
        const førsteBarnIdent = await førsteBarn.getAttribute("value");
        const andreBarnIdent = await andreBarn.getAttribute("value");

        await expect(component.getByRole("heading", { name: "Parter" })).toBeVisible();
        const bidragspliktigKort = component.getByRole("group", { name: "Bidragspliktig" });
        await expect(bidragspliktigKort.getByRole("button")).toHaveCount(0);

        await førsteBarn.check();
        await expect(component.getByRole("searchbox", { name: /Søk etter bidragsmottaker/ })).toHaveCount(0);

        await andreBarn.check();
        await expect(førsteBarn).not.toBeChecked();
        await expect(component.getByText(/Saken vil bli sendt til enhet NAV Test \(4806\)/)).toBeVisible();
        await expectNoAxeViolations(page, component);

        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();
        const roller = requests.create?.roller as { type: string; fodselsnummer: string }[];
        expect(roller.map((r) => r.type)).toEqual(["BP", "BM", "BA"]);
        expect(roller[2]?.fodselsnummer).toBe(andreBarnIdent);
        expect(JSON.stringify(requests.create)).not.toContain(førsteBarnIdent);
    });

    test("viser relasjons- og tilgangsadvarsel når bidragsmottaker er ukjent", async ({ mount, page }) => {
        await mockWizardApi(page, { accessAllowed: false });
        const component = await mount(`${STORY}/ForelderUkjentBidragsmottaker`);

        await component.getByRole("checkbox").first().check();

        await expect(component.getByText(/manglende eller ufullstendig relasjon/)).toBeVisible();
        await expect(component.getByText(/ikke tilgang til å opprette sak uten bidragsmottaker/)).toBeVisible();
        await expect(component.getByRole("radiogroup", { name: "Hvem er reell mottaker?" }).first()).toBeVisible();
    });

    test("nullstiller ikke skjemaet ved forsøk på å legge til allerede valgt barn", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        const component = await mount(`${STORY}/ForelderMedBarn`);
        await component.getByRole("checkbox").first().check();
        const valgtIdent = await component.getByRole("checkbox").first().getAttribute("value");

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(valgtIdent ?? "");
        await søk.press("Enter");

        await expect(page.getByText(/allerede i listen over valgte barn/)).toBeVisible();
        await expect(component.getByRole("checkbox").first()).toBeChecked();
        expect(requests.create).toBeUndefined();
    });
});

test.describe("Start fra forelder uten registrerte barn", () => {
    const leggTilBarn = async (
        component: import("@playwright/test").Locator,
        page: import("@playwright/test").Page,
    ) => {
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(barnUnder18.ident);
        await søk.press("Enter");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
    };

    test("velger entydig registrert forelder automatisk", async ({ mount, page }) => {
        await mockWizardApi(page, { parentRelations: { [barnUnder18.ident]: [bm.ident] } });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await leggTilBarn(component, page);

        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        await expect(bmKort.getByText(bm.visningsnavn)).toBeVisible();
        await expect(bmKort.getByRole("button", { name: `Bruk ${bm.visningsnavn}` })).toHaveCount(0);
        await expect(component.getByRole("searchbox", { name: /Søk etter bidragsmottaker/ })).toHaveCount(0);
        await expectNoAxeViolations(page, component);
    });

    test("foreslår begge når barnet har to andre registrerte foreldre", async ({ mount, page }) => {
        await mockWizardApi(page, { parentRelations: { [barnUnder18.ident]: [bm.ident, annenForelder.ident] } });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await leggTilBarn(component, page);

        await expect(component.getByText(/har begge foreldre registrert/)).toBeVisible();
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        await expect(bmKort.getByRole("button", { name: `Bruk ${bm.visningsnavn}` })).toBeVisible();
        await expect(bmKort.getByRole("button", { name: `Bruk ${annenForelder.visningsnavn}` })).toBeVisible();
        await expect(bmKort.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
    });

    test("viser datakvalitetsfeil ved mer enn to registrerte foreldre", async ({ mount, page }) => {
        await mockWizardApi(page, {
            parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident, annenForelder.ident] },
        });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await leggTilBarn(component, page);

        await expect(component.getByText(/har flere enn 2 registrerte foreldre/)).toBeVisible();
    });

    test("blokkerer ukjent bidragsmottaker når tilgang mangler", async ({ mount, page }) => {
        await mockWizardApi(page, { accessAllowed: false });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await leggTilBarn(component, page);
        await component.getByRole("button", { name: "Registrer bidragsmottaker som ukjent" }).click();

        await expect(component.getByText(/ikke tilgang til å opprette sak uten bidragsmottaker/)).toBeVisible();
        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect(component.getByText(/Kan ikke opprette saken ennå/)).toBeVisible();
    });
});

test.describe("Start fra barn", () => {
    test("barnet er låst, og valgt BP gir den andre forelderen som BM", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        await barnetsForeldre(page, [bp.ident, bm.ident]);
        const component = await mount(`${STORY}/BarnUnder18`);
        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });

        await expect(component.getByText(barnUnder18.visningsnavn).first()).toBeVisible();
        const låstBarn = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(låstBarn).toBeChecked();
        await låstBarn.click({ force: true });
        await expect(låstBarn).toBeChecked();
        await expect(component.getByRole("button", { name: "Legg til nytt barn" })).toBeVisible();

        await bpKort.getByRole("button", { name: `Bruk ${bp.visningsnavn}` }).click();
        await expect(bmKort.getByText(bm.visningsnavn)).toBeVisible();

        // Bytter roller ved å velge BM-personen som BP.
        await bpKort.getByRole("button", { name: "Endre bidragspliktig" }).click();
        await bpKort.getByRole("button", { name: `Bruk ${bm.visningsnavn}` }).click();
        await expect(bmKort.getByText(bp.visningsnavn)).toBeVisible();
        await expectNoAxeViolations(page, component);

        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();
        expect(requests.create?.roller).toEqual([
            expect.objectContaining({ fodselsnummer: bm.ident, type: "BP" }),
            expect.objectContaining({ fodselsnummer: bp.ident, type: "BM" }),
            expect.objectContaining({ type: "BA" }),
        ]);
    });

    test("viser felles barn med valgt BM og fjerner dem når BM endres", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        await barnetsForeldre(page, [bp.ident, bm.ident]);
        await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
            await route.fulfill({
                json: {
                    person: bp,
                    personensMotpartBarnRelasjon: [
                        { forelderrolleMotpart: "MOR", motpart: bm, fellesBarn: [testpersoner.barnUnder18NummerTo] },
                        { forelderrolleMotpart: "MOR", motpart: annenForelder, fellesBarn: [testpersoner.barnOver18] },
                    ],
                },
            });
        });
        const component = await mount(`${STORY}/BarnUnder18`);
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });

        const søsken = component.getByRole("checkbox", {
            name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}`,
        });
        await expect(søsken).toHaveCount(0);
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("button", { name: `Bruk ${bp.visningsnavn}` })
            .click();

        await expect(søsken).toBeVisible();
        await expect(component.getByRole("checkbox", { name: /Test Barn Over 18/ })).toHaveCount(0);
        await søsken.check();

        await bmKort.getByRole("button", { name: "Endre bidragsmottaker" }).click();
        await expect(søsken).toHaveCount(0);
        await bmKort.getByRole("button", { name: `Bruk ${bm.visningsnavn}` }).click();
        await søsken.check();

        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();
        const roller = requests.create?.roller as { type: string; fodselsnummer: string }[];
        expect(roller.filter((r) => r.type === "BA")).toHaveLength(2);
        expect(roller).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ fodselsnummer: testpersoner.barnUnder18NummerTo.ident, type: "BA" }),
            ]),
        );
    });

    test("eksisterende sak mellom partene sperrer opprettelse", async ({ mount, page }) => {
        await mockWizardApi(page);
        await barnetsForeldre(page, [bp.ident, bm.ident]);
        await page.route(/\/proxy\/bidrag-sak\/person\/sak$/, async (route) => {
            await route.fulfill({
                json: [
                    {
                        saksnummer: "7654321",
                        roller: [
                            { fodselsnummer: bp.ident, type: "BP" },
                            { fodselsnummer: bm.ident, type: "BM" },
                            { fodselsnummer: "barn", type: "BA" },
                        ],
                    },
                ],
            });
        });
        const component = await mount(`${STORY}/BarnUnder18`);
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("button", { name: `Bruk ${bp.visningsnavn}` })
            .click();

        await expect(component.getByText(/7654321/)).toBeVisible();
        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect(
            component.getByText("Kan ikke opprette saken ennå. Kontroller feltene og meldingene over."),
        ).toBeVisible();
    });

    test("🔴 blokkerer ukjent bidragsmottaker når tilgang mangler", async ({ mount, page }) => {
        const requests = await mockWizardApi(page, { accessAllowed: false });
        await barnetsForeldre(page, [bp.ident, bm.ident]);
        const component = await mount(`${STORY}/BarnUnder18`);
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("button", { name: `Bruk ${bp.visningsnavn}` })
            .click();
        await bmKort.getByRole("button", { name: "Endre bidragsmottaker" }).click();
        await bmKort.getByRole("button", { name: "Registrer bidragsmottaker som ukjent" }).click();

        await expect(component.getByText(/ikke tilgang til å opprette sak uten bidragsmottaker/)).toBeVisible();
        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect(component.getByText(/Kan ikke opprette saken ennå/)).toBeVisible();
        expect(requests.create).toBeUndefined();
    });

    test("uten registrerte foreldre: søk og ukjent i begge kort, RM påkrevd for myndig barn", async ({
        mount,
        page,
    }) => {
        await mockWizardApi(page);
        const component = await mount(`${STORY}/BarnOver18`);

        await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
        await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
        await expect(component.getByRole("button", { name: "Registrer bidragspliktig som ukjent" })).toBeVisible();
        await expect(component.getByRole("button", { name: "Registrer bidragsmottaker som ukjent" })).toBeVisible();
        await expect(component.getByRole("radiogroup", { name: "Hvem er reell mottaker?" })).toBeVisible();
        await expectNoAxeViolations(page, component);
    });
});
