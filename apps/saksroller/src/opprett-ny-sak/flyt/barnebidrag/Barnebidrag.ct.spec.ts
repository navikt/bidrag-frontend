import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { testpersoner } from "../../../../playwright/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockOpprettSakApi } from "../../../../playwright/opprett-ny-sak/network";

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
    test("reell mottaker er deaktivert og uten valgt alternativ når barnet ikke er valgt", async ({ mount }) => {
        const component = await mount(`${STORY}/ForelderMedBarn`);
        const barnValg = barnCheckboxer(component).first();
        const mottakerGruppe = component.getByRole("radiogroup", { name: "Hvem er reell mottaker?" }).first();
        const samhandlerValg = mottakerGruppe.getByRole("radio", { name: "Annen person eller samhandler" });

        await expect(mottakerGruppe).toBeVisible();
        await expect(samhandlerValg).toBeDisabled();
        await expect(samhandlerValg).not.toBeChecked();

        await barnValg.check();
        await expect(samhandlerValg).toBeEnabled();
        await samhandlerValg.click();
        await expect(samhandlerValg).toBeChecked();

        await barnValg.uncheck();
        await expect(samhandlerValg).toBeDisabled();
        for (const valg of await mottakerGruppe.getByRole("radio").all()) {
            await expect(valg).not.toBeChecked();
        }
    });

    test("Velg alle velger og fjerner alle barna i kurven", async ({ mount }) => {
        const component = await mount(`${STORY}/ForelderMedBarn`);
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
        const førsteBarn = barnCheckboxer(component).first();
        const andreBarn = barnCheckboxer(component).nth(1);
        const førsteBarnIdent = await førsteBarn.getAttribute("value");
        const andreBarnIdent = await andreBarn.getAttribute("value");

        await expect(component.getByRole("heading", { name: "Bidragspliktig og bidragsmottaker" })).toBeVisible();
        const bidragspliktigKort = component.getByRole("group", { name: "Bidragspliktig" });
        await expect(bidragspliktigKort.getByRole("button", { name: "Endre bidragspliktig" })).toBeVisible();

        const andreBarnValg = component.locator(`input[type="checkbox"][value="${andreBarnIdent}"]`);
        const førsteBarnValg = component.locator(`input[type="checkbox"][value="${førsteBarnIdent}"]`);

        await førsteBarn.check();
        await expect(component.getByRole("searchbox", { name: /Søk etter bidragsmottaker/ })).toHaveCount(0);
        await expect(andreBarnValg).toHaveCount(0);

        await component
            .getByRole("group", { name: "Bidragsmottaker" })
            .getByRole("button", { name: "Endre bidragsmottaker" })
            .click();
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
        const bpIdent = await component
            .getByRole("group", { name: "Bidragspliktig" })
            .locator(".personident")
            .first()
            .textContent();
        await barnetsForeldre(page, [bpIdent?.replace(/\D/g, "") ?? ""]);

        await barnCheckboxer(component).first().check();

        await expect(component.getByText(/ikke tilgang til å opprette sak uten bidragsmottaker/)).toBeVisible();
        await expect(component.getByRole("radiogroup", { name: "Hvem er reell mottaker?" }).first()).toBeVisible();
        await expect(component.getByText(/manglende eller ufullstendig relasjon/)).toHaveCount(0);
    });

    test("viser relasjonsadvarsel når bidragspliktig ikke er forelder til barnet", async ({ mount, page }) => {
        await mockOpprettSakApi(page);
        await barnetsForeldre(page, [annenForelder.ident]);
        const component = await mount(`${STORY}/ForelderUkjentBidragsmottaker`);

        await barnCheckboxer(component).first().check();

        await expect(component.getByText(/manglende eller ufullstendig relasjon/)).toBeVisible();
    });

    test("nullstiller ikke skjemaet ved forsøk på å legge til allerede valgt barn", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page);
        const component = await mount(`${STORY}/ForelderMedBarn`);
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
        await page.mouse.move(0, 0);
    };

    test("manuelt lagt til barn står i listen, er valgt og kan velges bort og inn igjen", async ({ mount, page }) => {
        await mockOpprettSakApi(page, { parentRelations: { [barnUnder18.ident]: [bm.ident] } });
        const component = await mount(`${STORY}/ForelderUtenBarn`);
        await leggTilBarn(component, page);

        const barnValg = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(component.getByText("Lagt til manuelt", { exact: true })).toHaveCount(0);
        await expect(barnValg).toBeChecked();

        await barnValg.uncheck();
        await expect(barnValg).not.toBeChecked();
        await barnValg.check();
        await expect(barnValg).toBeChecked();
    });

    test("viser helsøsken under begge foreldrene når én forelder er valgt", async ({ mount, page }) => {
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

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(manueltBarn.ident);
        await søk.press("Enter");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
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
        await expect(helsøskenValg).toHaveCount(2);
        await expect(helsøskenValg.nth(0)).toBeVisible();
        await expect(helsøskenValg.nth(0)).not.toBeChecked();
        await expect(helsøskenValg.nth(1)).not.toBeChecked();
        await expect(component.getByRole("checkbox", { name: `Velg ${halvsøsken.visningsnavn}` })).toHaveCount(0);
        await expect(component.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` })).toHaveCount(2);
        for (const forelder of [bp, bm]) {
            const gruppe = component.getByRole("group", { name: `Velg barn med ${forelder.visningsnavn}` });
            await expect(gruppe.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` })).toBeChecked();
            await expect(gruppe.getByRole("checkbox", { name: `Velg ${helsøsken.visningsnavn}` })).toBeVisible();
        }
        await expect(component.getByText("Barn lagt til manuelt", { exact: true })).toHaveCount(0);
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

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(manueltBarn.ident);
        await søk.press("Enter");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();

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
        await leggTilBarn(component, page);

        await expect(component.getByText(/har flere enn 2 registrerte foreldre/)).toBeVisible();
    });
});

test.describe("Start fra barn", () => {
    test("barnet kan velges bort, og valgt BP gir den andre forelderen som BM", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page);
        await barnetsForeldre(page, [bp.ident, bm.ident]);
        const component = await mount(`${STORY}/BarnUnder18`);
        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });

        await expect(component.getByText(barnUnder18.visningsnavn).first()).toBeVisible();
        const startbarn = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(startbarn).toBeChecked();
        await startbarn.uncheck();
        await expect(startbarn).not.toBeChecked();
        await startbarn.check();
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
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });

        const søsken = component.getByRole("checkbox", {
            name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}`,
        });
        const helsøskenflokker = component.getByRole("group", { name: /^Velg barn med / });
        await expect(helsøskenflokker).toHaveCount(2);
        await expect.poll(() => relasjonskall).toBeGreaterThan(0);
        const startbarn = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(startbarn).toHaveCount(2);
        await expect(startbarn.nth(0)).toBeChecked();
        await expect(startbarn.nth(1)).toBeChecked();
        await expect(søsken).toHaveCount(2);
        await expect(søsken.nth(0)).toBeVisible();
        await expect(søsken.nth(0)).not.toBeChecked();
        await expect(søsken.nth(1)).not.toBeChecked();
        await expect(component.getByText("Barn lagt til manuelt", { exact: true })).toHaveCount(0);
        await component
            .getByRole("group", { name: "Bidragspliktig" })
            .getByRole("combobox", { name: "Velg bidragspliktig" })
            .selectOption({ label: bp.visningsnavn });

        await expect(søsken).toHaveCount(2);
        await expect(component.getByRole("checkbox", { name: /Test Barn Over 18/ })).toHaveCount(0);
        await helsøskenflokker
            .nth(0)
            .getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}` })
            .check();
        await expect(
            helsøskenflokker
                .nth(1)
                .getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}` }),
        ).toBeDisabled();
        await helsøskenflokker
            .nth(0)
            .getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}` })
            .uncheck();
        const søskenUnderAndreForelder = helsøskenflokker
            .nth(1)
            .getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}` });
        await expect(søskenUnderAndreForelder).toBeEnabled();
        await søskenUnderAndreForelder.check();
        await expect(
            helsøskenflokker
                .nth(0)
                .getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18NummerTo.visningsnavn}` }),
        ).toBeDisabled();

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

        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
        const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
        await expect(bpKort.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
        await expect(bmKort.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
        await expect(bpKort.getByRole("combobox", { name: "Velg bidragspliktig" })).toBeVisible();
        await expect(bmKort.getByRole("combobox", { name: "Velg bidragsmottaker" })).toBeVisible();
        await expect(bpKort.getByRole("option", { name: "Ukjent", exact: true })).toHaveCount(1);
        await expect(bmKort.getByRole("option", { name: "Ukjent", exact: true })).toHaveCount(1);
        await expect(component.getByRole("radiogroup", { name: "Hvem er reell mottaker?" })).toBeVisible();
        await expectNoAxeViolations(page, component);
    });
});
