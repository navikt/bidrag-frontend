import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { testpersoner } from "../../../../playwright/opprett-ny-sak/fixtures";
import {
    expectNoAxeViolations,
    mockOpprettSakApi,
    åpneSøskenflokker,
} from "../../../../playwright/opprett-ny-sak/network";

const STORY = "opprett-ny-sak/flyt/barnebidrag/Barnebidrag";
const { bidragspliktig: bp, bidragsmottaker: bm, annenForelder, barnUnder18 } = testpersoner;

/** Storyen genererer egne identer, så barnet i storyen får foreldrene uansett ident. */
async function barnetsForeldre(
    page: import("@playwright/test").Page,
    foreldre: string[],
    onBarnIdent?: (ident: string) => void,
) {
    await page.route(/\/proxy\/bidrag-person\/forelderbarnrelasjon$/, async (route) => {
        const { ident } = route.request().postDataJSON() as { ident: string };
        onBarnIdent?.(ident);
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

function barnCheckboxer(component: import("@playwright/test").Locator) {
    return component.getByRole("checkbox", { name: /^Velg (?!alle)/ });
}

async function velgForelder(
    kort: import("@playwright/test").Locator,
    rolle: "bidragspliktig" | "bidragsmottaker",
    navn: string,
) {
    await kort.getByRole("combobox", { name: `Velg ${rolle}` }).selectOption({ label: navn });
}

test.describe("Start fra forelder med barn", () => {
    test("søskenflokker starter lukket og åpnes når både BP og BM er valgt", async ({ mount, page }) => {
        await mockOpprettSakApi(page);
        const component = await mount(`${STORY}/ForelderMedBarn`);
        const flokker = component.getByRole("region", { name: "Søskenflokker" });
        await expect(flokker.getByRole("button", { expanded: false })).toHaveCount(2);
        await expect(flokker.getByRole("button", { expanded: true })).toHaveCount(0);
        await expect(barnCheckboxer(component)).toHaveCount(0);
        const flokk = flokker.getByRole("button", { name: `${bp.visningsnavn} og ${bm.visningsnavn}` });
        await expect(flokk).toBeVisible();

        await velgForelder(
            component.getByRole("group", { name: "Bidragsmottaker" }),
            "bidragsmottaker",
            bm.visningsnavn,
        );
        await expect(flokk).toHaveAttribute("aria-expanded", "true");
        const barn = barnCheckboxer(component).first();
        await barn.check();
        await flokk.click();
        await expect(flokk).toHaveAttribute("aria-expanded", "false");
        await expect(barnCheckboxer(component)).toHaveCount(0);
        await flokk.click();
        await expect(barn).toBeChecked();
    });

    test("alle registrerte foreldre beholdes i BP- og BM-listene når et foreldrepar velges", async ({
        mount,
        page,
    }) => {
        await mockOpprettSakApi(page);
        await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
            const { ident } = route.request().postDataJSON() as { ident: string };
            await route.fulfill({
                json: { person: { ...annenForelder, ident }, personensMotpartBarnRelasjon: [] },
            });
        });
        const component = await mount(`${STORY}/ForelderMedBarn`);
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        const bmValg = bmKort.getByRole("combobox", { name: "Velg bidragsmottaker" });
        await expect(bmValg.getByRole("option", { name: bm.visningsnavn })).toHaveCount(1);
        await expect(bmValg.getByRole("option", { name: annenForelder.visningsnavn })).toHaveCount(1);

        await bmValg.selectOption({ label: bm.visningsnavn });
        await bmKort.getByRole("button", { name: "Endre bidragsmottaker" }).click();
        await expect(bmValg.getByRole("option", { name: bm.visningsnavn })).toHaveCount(1);
        await expect(bmValg.getByRole("option", { name: annenForelder.visningsnavn })).toHaveCount(1);
        await bmValg.selectOption({ label: annenForelder.visningsnavn });
        await expect(
            component.getByRole("button", { name: `${bp.visningsnavn} og ${annenForelder.visningsnavn}` }),
        ).toBeVisible();

        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
        await bpKort.getByRole("button", { name: "Endre bidragspliktig" }).click();
        const bpValg = bpKort.getByRole("combobox", { name: "Velg bidragspliktig" });
        await expect(bpValg.getByRole("option", { name: bp.visningsnavn })).toHaveCount(1);
        await expect(bpValg.getByRole("option", { name: bm.visningsnavn })).toHaveCount(1);
        await expect(bpValg.getByRole("option", { name: annenForelder.visningsnavn })).toHaveCount(1);
    });

    test("reell mottaker er deaktivert og uten valgt alternativ når barnet ikke er valgt", async ({ mount }) => {
        const component = await mount(`${STORY}/ForelderMedBarn`);
        await åpneSøskenflokker(component);
        const barnValg = barnCheckboxer(component).first();
        const mottakerValg = component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).first();

        await expect(mottakerValg).toBeVisible();
        await expect(mottakerValg).toBeDisabled();
        await expect(mottakerValg).toHaveValue("");

        await barnValg.check();
        await expect(mottakerValg).toBeEnabled();
        await expect(mottakerValg).toHaveValue("ingen");
        await mottakerValg.selectOption("samhandler");
        await expect(mottakerValg).toHaveValue("samhandler");

        await barnValg.uncheck();
        await expect(mottakerValg).toBeDisabled();
        await expect(mottakerValg).toHaveValue("");
    });

    test("Velg alle velger og fjerner alle barna i kurven", async ({ mount }) => {
        const component = await mount(`${STORY}/ForelderMedBarn`);
        await åpneSøskenflokker(component);
        const velgAlle = component.getByRole("checkbox", { name: /^Velg alle/ }).first();
        const kurv = component.getByRole("group", { name: /^Velg barn med/ }).first();

        await velgAlle.check();
        for (const barn of await kurv.getByRole("checkbox").all()) {
            await expect(barn).toBeChecked();
        }

        await velgAlle.uncheck();
        for (const barn of await kurv.getByRole("checkbox").all()) {
            await expect(barn).not.toBeChecked();
        }
    });

    test("valgt motpart viser bare felles barn, Endre gir alle kurvene tilbake", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page);
        const component = await mount(`${STORY}/ForelderMedBarn`);
        await åpneSøskenflokker(component);
        const førsteBarn = barnCheckboxer(component).first();
        const andreBarn = barnCheckboxer(component).nth(1);
        const førsteBarnIdent = await førsteBarn.getAttribute("value");
        const andreBarnIdent = await andreBarn.getAttribute("value");

        await expect(component.getByRole("heading", { name: "Bidragsmottaker og bidragspliktig" })).toBeVisible();
        const bidragspliktigKort = component.getByRole("group", { name: "Bidragspliktig" });
        await expect(bidragspliktigKort.getByRole("button", { name: "Endre bidragspliktig" })).toBeVisible();

        const andreBarnValg = component.getByRole("checkbox", {
            name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}`,
        });
        const førsteBarnValg = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });

        await førsteBarn.check();
        await expect(component.getByRole("searchbox", { name: /Søk etter bidragsmottaker/ })).toHaveCount(0);
        await expect(andreBarnValg).toHaveCount(0);

        await component
            .getByRole("group", { name: "Bidragsmottaker" })
            .getByRole("button", { name: "Endre bidragsmottaker" })
            .click();
        await åpneSøskenflokker(component);
        await andreBarnValg.check();
        await expect(førsteBarnValg).toHaveCount(0);
        await expect(component.getByText(/Saken vil bli sendt til enhet NAV Test \(4806\)/)).toBeVisible();
        await expectNoAxeViolations(page, component);

        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();
        const roller = requests.create?.roller as { type: string; fodselsnummer: string }[];
        expect(roller.map((r) => r.type)).toEqual(["BP", "BM", "BA"]);
        expect(roller[2]?.fodselsnummer).toBe(andreBarnIdent);
        expect(JSON.stringify(requests.create)).not.toContain(førsteBarnIdent);
        await expect(component.getByText("Sak opprettet med saksnummer 1234567.")).toBeVisible();
        await expect(component.getByRole("button", { name: /^Opprett/ })).toHaveCount(0);
    });

    test("viser tilgangsadvarsel, men ikke relasjonsadvarsel, når bidragsmottaker er ukjent", async ({
        mount,
        page,
    }) => {
        await mockOpprettSakApi(page, { accessAllowed: false });
        const component = await mount(`${STORY}/ForelderUkjentBidragsmottaker`);
        await åpneSøskenflokker(component);
        const bpIdent = await component
            .getByRole("group", { name: "Bidragspliktig" })
            .locator(".personident")
            .first()
            .textContent();
        await barnetsForeldre(page, [bpIdent?.replace(/\D/g, "") ?? ""]);

        await barnCheckboxer(component).first().check();

        await expect(component.getByText(/ikke tilgang til å opprette sak uten bidragsmottaker/)).toBeVisible();
        await expect(component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).first()).toBeVisible();
        await expect(component.getByText(/manglende eller ufullstendig relasjon/)).toHaveCount(0);
    });

    test("viser relasjonsadvarsel når bidragspliktig ikke er forelder til barnet", async ({ mount, page }) => {
        await mockOpprettSakApi(page);
        await barnetsForeldre(page, [annenForelder.ident]);
        const component = await mount(`${STORY}/ForelderUkjentBidragsmottaker`);
        await åpneSøskenflokker(component);

        await barnCheckboxer(component).first().check();

        await expect(component.getByText(/manglende eller ufullstendig relasjon/)).toBeVisible();
    });

    test("nullstiller ikke skjemaet ved forsøk på å legge til allerede valgt barn", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page);
        const component = await mount(`${STORY}/ForelderMedBarn`);
        await åpneSøskenflokker(component);
        await barnCheckboxer(component).first().check();
        const valgtIdent = await barnCheckboxer(component).first().getAttribute("value");

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(valgtIdent ?? "");
        await søk.press("Enter");

        await expect(page.getByText(/er allerede lagt til/)).toBeVisible();
        await expect(barnCheckboxer(component).first()).toBeChecked();
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
        await åpneSøskenflokker(component);
        await page.mouse.move(0, 0);
    };

    test("manuelt lagt til barn står i listen, er valgt og kan velges bort og inn igjen", async ({ mount, page }) => {
        await mockOpprettSakApi(page, { parentRelations: { [barnUnder18.ident]: [bm.ident] } });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await åpneSøskenflokker(component);
        await leggTilBarn(component, page);

        const barnValg = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(component.getByText("Lagt til manuelt", { exact: true })).toHaveCount(0);
        await expect(barnValg).toBeChecked();

        await barnValg.uncheck();
        await expect(barnValg).not.toBeChecked();
        await barnValg.check();
        await expect(barnValg).toBeChecked();
    });

    test("samler helsøsken og beholder flokken når alle valg fjernes", async ({ mount, page }) => {
        const manueltBarn = {
            ident: genererFnr(),
            visningsnavn: "Test Manuelt Barn",
            fødselsdato: "2014-05-01",
        };
        const helsøsken = { ident: genererFnr(), visningsnavn: "Test Helsøsken", fødselsdato: "2016-06-01" };
        const halvsøsken = { ident: genererFnr(), visningsnavn: "Test Halvsøsken", fødselsdato: "2018-07-01" };
        await mockOpprettSakApi(page, {
            parentRelations: { [manueltBarn.ident]: [bp.ident, bm.ident] },
            personOverrides: {
                [manueltBarn.ident]: manueltBarn,
                [helsøsken.ident]: helsøsken,
                [halvsøsken.ident]: halvsøsken,
            },
        });
        await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
            const { ident } = route.request().postDataJSON() as { ident: string };
            const person = ident === bm.ident ? bm : bp;
            await route.fulfill({
                json: {
                    person,
                    personensMotpartBarnRelasjon:
                        ident === bp.ident
                            ? [
                                  {
                                      forelderrolleMotpart: "MOR",
                                      motpart: bm,
                                      fellesBarn: [manueltBarn, helsøsken],
                                  },
                                  { forelderrolleMotpart: "FAR", motpart: annenForelder, fellesBarn: [halvsøsken] },
                              ]
                            : [
                                  {
                                      forelderrolleMotpart: "FAR",
                                      motpart: bp,
                                      fellesBarn: [manueltBarn, helsøsken],
                                  },
                              ],
                },
            });
        });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await åpneSøskenflokker(component);

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(manueltBarn.ident);
        await søk.press("Enter");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await åpneSøskenflokker(component);
        await velgForelder(
            component.getByRole("group", { name: "Bidragsmottaker" }),
            "bidragsmottaker",
            bm.visningsnavn,
        );
        await expect(
            component.getByRole("group", { name: "Bidragsmottaker" }).getByRole("button", {
                name: "Endre bidragsmottaker",
            }),
        ).toBeVisible();

        const helsøskenValg = component.getByRole("checkbox", { name: `Velg ${helsøsken.visningsnavn}` });
        await expect(helsøskenValg).toHaveCount(1);
        await expect(helsøskenValg).toBeVisible();
        await expect(helsøskenValg).not.toBeChecked();
        await expect(component.getByRole("checkbox", { name: `Velg ${halvsøsken.visningsnavn}` })).toHaveCount(0);
        await expect(component.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` })).toBeChecked();
        await expect(
            component.getByRole("button", {
                name: /Test Bidragspliktig og Test Bidragsmottaker|Test Bidragsmottaker og Test Bidragspliktig/,
            }),
        ).toBeVisible();
        await expect(component.getByText("Barn lagt til manuelt", { exact: true })).toHaveCount(0);

        await component.getByRole("button", { name: "Endre bidragsmottaker" }).click();
        await component.getByRole("button", { name: "Endre bidragspliktig" }).click();
        const manueltBarnValg = component.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` });
        await manueltBarnValg.uncheck();
        await expect(component.getByText("0 valgt", { exact: true })).toBeVisible();
        await expect(manueltBarnValg).toBeVisible();
        await expect(manueltBarnValg).not.toBeChecked();
        await expect(helsøskenValg).toBeVisible();
        await expect(helsøskenValg).not.toBeChecked();
        await expect(component.getByRole("button", { name: "Foreldre ikke valgt", exact: true })).toHaveCount(0);
        const flokk = component.getByRole("button", {
            name: /Test Bidragspliktig og Test Bidragsmottaker|Test Bidragsmottaker og Test Bidragspliktig/,
        });
        await expect(flokk).toHaveAttribute("aria-expanded", "true");
        await flokk.click();
        await expect(flokk).toHaveAttribute("aria-expanded", "false");
        await flokk.click();
        await expect(helsøskenValg).toBeVisible();
        await manueltBarnValg.check();
        await expect(manueltBarnValg).toBeChecked();
        await expect(helsøskenValg).toBeVisible();
    });

    test("viser ikke søsken når begge foreldrene ikke er kjent", async ({ mount, page }) => {
        const manueltBarn = {
            ident: genererFnr(),
            visningsnavn: "Test Manuelt Barn",
            fødselsdato: "2014-05-01",
        };
        const førsteSøsken = { ident: genererFnr(), visningsnavn: "Test Søsken 1", fødselsdato: "2016-06-01" };
        const andreSøsken = { ident: genererFnr(), visningsnavn: "Test Søsken 2", fødselsdato: "2018-07-01" };
        await mockOpprettSakApi(page, {
            parentRelations: { [manueltBarn.ident]: [bm.ident, annenForelder.ident] },
            personOverrides: {
                [manueltBarn.ident]: manueltBarn,
                [førsteSøsken.ident]: førsteSøsken,
                [andreSøsken.ident]: andreSøsken,
            },
        });
        await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
            const { ident } = route.request().postDataJSON() as { ident: string };
            await route.fulfill({
                json: {
                    person: bm,
                    personensMotpartBarnRelasjon:
                        ident === bm.ident
                            ? [
                                  {
                                      forelderrolleMotpart: "UKJENT",
                                      motpart: null,
                                      fellesBarn: [manueltBarn, førsteSøsken],
                                  },
                                  {
                                      forelderrolleMotpart: "UKJENT",
                                      motpart: null,
                                      fellesBarn: [manueltBarn, andreSøsken],
                                  },
                              ]
                            : [],
                },
            });
        });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await åpneSøskenflokker(component);

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(manueltBarn.ident);
        await søk.press("Enter");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await åpneSøskenflokker(component);

        // BP er valgt, BM er ikke valgt ennå. Barnet vises derfor under «Bidragsmottaker ikke valgt».
        const ukjentForelderGruppe = component.getByRole("group", { name: "Bidragsmottaker ikke valgt" });
        await expect(ukjentForelderGruppe.getByRole("checkbox")).toHaveCount(1);
        await expect(
            ukjentForelderGruppe.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` }),
        ).toBeChecked();
        await expect(component.getByRole("checkbox", { name: `Velg ${førsteSøsken.visningsnavn}` })).toHaveCount(0);
        await expect(component.getByRole("checkbox", { name: `Velg ${andreSøsken.visningsnavn}` })).toHaveCount(0);
        await expect(component.getByText("Barn lagt til manuelt", { exact: true })).toHaveCount(0);
        await expect(component.getByText(/ukjent forelder \d+/i)).toHaveCount(0);
    });

    test("legger til barn, får entydig forelder automatisk og oppretter sak", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page, { parentRelations: { [barnUnder18.ident]: [bm.ident] } });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await åpneSøskenflokker(component);
        const hint = component.getByText("Velg barn nedenfor for å få forslag til foreldre.");
        await expect(hint).toBeVisible();
        await leggTilBarn(component, page);
        await expect(hint).toHaveCount(0);

        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        await expect(bmKort.getByText(bm.visningsnavn)).toBeVisible();
        await expect(bmKort.getByRole("combobox", { name: "Velg bidragsmottaker" })).toHaveCount(0);
        await expect(component.getByRole("searchbox", { name: /Søk etter bidragsmottaker/ })).toHaveCount(0);
        await expectNoAxeViolations(page, component);

        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();
        expect(requests.create?.roller).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ fodselsnummer: bm.ident, type: "BM" }),
                expect.objectContaining({ fodselsnummer: barnUnder18.ident, type: "BA" }),
            ]),
        );
        await expect(component.getByText("Sak opprettet med saksnummer 1234567.")).toBeVisible();
    });

    test("viser datakvalitetsfeil ved mer enn to registrerte foreldre", async ({ mount, page }) => {
        await mockOpprettSakApi(page, {
            parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident, annenForelder.ident] },
        });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await åpneSøskenflokker(component);
        await leggTilBarn(component, page);

        await expect(component.getByText(/har flere enn 2 registrerte foreldre/)).toBeVisible();
    });
});

test.describe("Start fra barn", () => {
    test("barnet kan velges bort, og valgt BP gir den andre forelderen som BM", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page);
        await barnetsForeldre(page, [bp.ident, bm.ident]);
        const component = await mount(`${STORY}/BarnUnder18`);
        await åpneSøskenflokker(component);
        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });

        await expect(component.getByText(barnUnder18.visningsnavn).first()).toBeVisible();
        const startbarn = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(startbarn).toBeChecked();
        await startbarn.click();
        await åpneSøskenflokker(component);
        await expect(startbarn).not.toBeChecked();
        await startbarn.click();
        await åpneSøskenflokker(component);
        await expect(startbarn).toBeChecked();
        await expect(component.getByRole("button", { name: "Legg til nytt barn" })).toBeVisible();

        const bpValg = bpKort.getByRole("combobox", { name: "Velg bidragspliktig" });
        await expect(bpValg.getByRole("option", { name: bp.visningsnavn })).toHaveCount(1);
        await expect(bpValg.getByRole("option", { name: bm.visningsnavn })).toHaveCount(1);
        await expect(bpValg.getByRole("option", { name: "Ukjent", exact: true })).toHaveCount(1);

        await velgForelder(bpKort, "bidragspliktig", bp.visningsnavn);
        await expect(bmKort.getByText(bm.visningsnavn)).toBeVisible();

        // Bytter roller ved å velge BM-personen som BP.
        await bpKort.getByRole("button", { name: "Endre bidragspliktig" }).click();
        await velgForelder(bpKort, "bidragspliktig", bm.visningsnavn);
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

    test("henter barn på nytt når en forelder velges", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page);
        let barnIdent = "";
        await barnetsForeldre(page, [bp.ident, bm.ident], (ident) => (barnIdent = ident));
        let relasjonskall = 0;
        await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
            relasjonskall += 1;
            const { ident } = route.request().postDataJSON() as { ident: string };
            const forelder = ident === bp.ident ? bp : bm;
            const motpart = ident === bp.ident ? bm : bp;
            await route.fulfill({
                json: {
                    person: forelder,
                    personensMotpartBarnRelasjon: [
                        {
                            forelderrolleMotpart: "MOR",
                            motpart,
                            fellesBarn: [{ ...barnUnder18, ident: barnIdent }, testpersoner.barnUnder18NummerTo],
                        },
                        ...(ident === bp.ident
                            ? [
                                  {
                                      forelderrolleMotpart: "MOR",
                                      motpart: annenForelder,
                                      fellesBarn: [testpersoner.barnOver18],
                                  },
                              ]
                            : []),
                    ],
                },
            });
        });
        const component = await mount(`${STORY}/BarnUnder18`);
        await åpneSøskenflokker(component);
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });

        const søsken = component.getByRole("checkbox", {
            name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}`,
        });
        const helsøskenflokker = component.getByRole("group", { name: /^Velg barn med / });
        await expect(helsøskenflokker).toHaveCount(1);
        await expect.poll(() => relasjonskall).toBeGreaterThan(0);
        const startbarn = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(startbarn).toBeChecked();
        await expect(søsken).toHaveCount(1);
        await expect(søsken).toBeVisible();
        await expect(søsken).not.toBeChecked();
        await expect(component.getByText("Barn lagt til manuelt", { exact: true })).toHaveCount(0);
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("combobox", { name: "Velg bidragspliktig" })
            .selectOption({ label: bp.visningsnavn });

        await expect(søsken).toHaveCount(1);
        await expect(component.getByRole("checkbox", { name: /Test Barn Over 18/ })).toHaveCount(0);
        await søsken.check();
        await expect(søsken).toBeChecked();
        await søsken.uncheck();
        await expect(søsken).not.toBeChecked();
        await søsken.check();

        await bmKort.getByRole("button", { name: "Endre bidragsmottaker" }).click();
        await expect(
            helsøskenflokker
                .nth(0)
                .getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}` }),
        ).toBeChecked();
        await expect(component.getByRole("checkbox", { name: /Test Barn Over 18/ })).toHaveCount(0);
        await velgForelder(bmKort, "bidragsmottaker", bm.visningsnavn);
        await expect(component.getByRole("checkbox", { name: /Test Barn Over 18/ })).toHaveCount(0);
        await expect(
            helsøskenflokker
                .nth(0)
                .getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}` }),
        ).toBeChecked();

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
        const requests = await mockOpprettSakApi(page);
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
        await åpneSøskenflokker(component);
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("combobox", { name: "Velg bidragspliktig" })
            .selectOption({ label: bp.visningsnavn });

        await expect(component.getByText(/7654321/)).toBeVisible();
        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect(
            component.getByText(
                "Kan ikke opprette saken. Det finnes allerede en sak mellom disse partene med samme roller. Åpne saken i varselet over, eller endre en av partene.",
            ),
        ).toBeVisible();
        expect(requests.create).toBeUndefined();
    });

    test("🔴 blokkerer ukjent bidragsmottaker når tilgang mangler", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page, { accessAllowed: false });
        await barnetsForeldre(page, [bp.ident, bm.ident]);
        const component = await mount(`${STORY}/BarnUnder18`);
        await åpneSøskenflokker(component);
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("combobox", { name: "Velg bidragspliktig" })
            .selectOption({ label: bp.visningsnavn });
        // BM fylles ut fra barnets foreldre når BP er valgt. Endre for å kunne sette BM som ukjent.
        await bmKort.getByRole("button", { name: "Endre bidragsmottaker" }).click();
        await expect(bmKort.getByRole("combobox", { name: "Velg bidragsmottaker" })).toBeVisible();
        await velgForelder(bmKort, "bidragsmottaker", "Ukjent");

        await expect(component.getByText(/ikke tilgang til å opprette sak uten bidragsmottaker/)).toBeVisible();
        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect(component.getByText(/Kan ikke opprette saken ennå/)).toBeVisible();
        expect(requests.create).toBeUndefined();
    });

    test("uten registrerte foreldre: søk og ukjent i begge kort, RM påkrevd for myndig barn", async ({
        mount,
        page,
    }) => {
        await mockOpprettSakApi(page);
        const component = await mount(`${STORY}/BarnOver18`);
        await åpneSøskenflokker(component);

        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        await expect(bpKort.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
        await expect(bmKort.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
        await expect(bpKort.getByRole("combobox", { name: "Velg bidragspliktig" })).toBeVisible();
        await expect(bmKort.getByRole("combobox", { name: "Velg bidragsmottaker" })).toBeVisible();
        await expect(bpKort.getByRole("option", { name: "Ukjent", exact: true })).toHaveCount(1);
        await expect(bmKort.getByRole("option", { name: "Ukjent", exact: true })).toHaveCount(1);
        await expect(component.getByRole("combobox", { name: "Hvem er reell mottaker?" })).toBeVisible();
        await expectNoAxeViolations(page, component);
    });
});
