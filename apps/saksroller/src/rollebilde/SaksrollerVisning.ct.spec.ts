import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { lagRolle, lagSak, testpersoner } from "../../playwright/saksroller/fixtures.ts";
import { mockSaksrollerApi } from "../../playwright/saksroller/network.ts";

const STORY = "rollebilde/SaksrollerVisning/Standard";

test.describe("SaksrollerVisning", () => {
    test("byttet RM vises for riktig barn og bare siste RM lagres", async ({ mount, page }) => {
        const mottaker = { ident: genererFnr(), visningsnavn: "Ny Reell Mottaker", fødselsdato: "1985-01-01" };
        const { requests } = await mockSaksrollerApi(page, { personOverrides: { [mottaker.ident]: mottaker } });
        const component = await mount(STORY);
        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("barnet_selv");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await component.getByRole("button", { name: "Endre reell mottaker" }).click();
        const dialog = component.getByRole("dialog", { name: "Endre reell mottaker" });
        await dialog.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("samhandler");
        const søk = dialog.getByRole("searchbox", { name: "Person- eller samhandlerident" });
        await søk.fill(mottaker.ident);
        await søk.press("Enter");
        await expect(dialog.getByText(mottaker.visningsnavn)).toBeVisible();
        await dialog.getByRole("button", { name: "Legg til", exact: true }).click();
        await expect(component.getByText(mottaker.visningsnavn).first()).toBeVisible();
        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();
        await expect
            .poll(() => requests.update?.roller)
            .toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        fodselsnummer: testpersoner.barn.ident,
                        type: "BA",
                        reellMottaker: { ident: mottaker.ident, verge: false },
                    }),
                ]),
            );
        expect(requests.update?.roller).toHaveLength(3);
    });

    test("nytt barn som fjernes sendes ikke ved lagring og lagrede roller beholdes", async ({ mount, page }) => {
        const nyttBarn = { ident: genererFnr(), visningsnavn: "Angret Barn", fødselsdato: "2016-05-01" };
        const { requests } = await mockSaksrollerApi(page, { personOverrides: { [nyttBarn.ident]: nyttBarn } });
        const component = await mount(STORY);
        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await expect(component.getByRole("button", { name: "Fjern barn" })).toHaveCount(0);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søk = component.getByRole("searchbox", { name: "Søk etter barn" });
        await søk.fill(nyttBarn.ident);
        await søk.press("Enter");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await expect(component.getByText(nyttBarn.visningsnavn, { exact: true }).first()).toBeVisible();
        await component.getByRole("button", { name: "Fjern barn" }).click();
        await expect(component.getByText(nyttBarn.visningsnavn, { exact: true })).toHaveCount(0);
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("barnet_selv");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();
        await expect
            .poll(() => requests.update?.roller)
            .toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM" }),
                    expect.objectContaining({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP" }),
                    expect.objectContaining({
                        fodselsnummer: testpersoner.barn.ident,
                        type: "BA",
                        reellMottaker: { ident: testpersoner.barn.ident, verge: false },
                    }),
                ]),
            );
        expect(requests.update?.roller).toHaveLength(3);
    });

    test("viser eldste barn først uavhengig av rollerekkefølgen", async ({ mount, page }) => {
        const yngre = { ident: genererFnr(), visningsnavn: "Yngre Barn", fødselsdato: "2020-01-01" };
        const eldre = { ident: genererFnr(), visningsnavn: "Eldre Barn", fødselsdato: "2010-01-01" };
        await mockSaksrollerApi(page, {
            sak: lagSak({
                roller: [
                    lagRolle({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM", rolleType: "BM" }),
                    lagRolle({ fodselsnummer: yngre.ident, type: "BA", rolleType: "BA" }),
                    lagRolle({ fodselsnummer: eldre.ident, type: "BA", rolleType: "BA" }),
                ],
            }),
            personOverrides: { [yngre.ident]: yngre, [eldre.ident]: eldre },
        });
        const component = await mount(STORY);
        await expect(component.getByText(/^(Eldre Barn|Yngre Barn)$/)).toHaveText(["Eldre Barn", "Yngre Barn"]);
    });

    test("viser bidragsmottaker før bidragspliktig", async ({ mount, page }) => {
        await mockSaksrollerApi(page);
        const component = await mount(STORY);
        const foreldre = component.getByRole("heading", { name: /^(Bidragsmottaker|Bidragspliktig)$/ });
        await expect(foreldre).toHaveText(["Bidragsmottaker", "Bidragspliktig"]);
    });

    test("kan legge til første barn når saken ikke har barn", async ({ mount, page }) => {
        await mockSaksrollerApi(page, {
            sak: lagSak({
                roller: [
                    lagRolle({
                        fodselsnummer: testpersoner.bidragsmottaker.ident,
                        type: "BM",
                        rolleType: "BM",
                    }),
                ],
            }),
        });
        const component = await mount(STORY);

        await expect(component.getByText("Ingen barn registrert i saken ennå")).toBeVisible();
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await expect(component.getByRole("dialog", { name: "Legg til nytt barn i saken" })).toBeVisible();
    });

    test("viser rollehistorikk for forelder og barn i modaler", async ({ mount, page }) => {
        await mockSaksrollerApi(page, {
            sak: lagSak({
                roller: [
                    lagRolle({
                        fodselsnummer: testpersoner.bidragsmottaker.ident,
                        type: "BM",
                        rolleType: "BM",
                        rollehistorikk: [
                            {
                                type: "BM",
                                typeEndring: "Satt til BM manuelt",
                                opprettetAv: "Z123456",
                                opprettetTidspunkt: "2024-03-04T12:00:00Z",
                            },
                        ],
                    }),
                    lagRolle({
                        fodselsnummer: testpersoner.barn.ident,
                        type: "BA",
                        rolleType: "BA",
                        rollehistorikk: [
                            {
                                type: "BA",
                                typeEndring: "Endret RM manuelt",
                                opprettetAv: "Z987654",
                                opprettetTidspunkt: "2024-05-06T12:00:00Z",
                            },
                        ],
                    }),
                ],
            }),
        });
        const component = await mount(STORY);

        await component.getByRole("button", { name: "Vis rollehistorikk" }).first().click();
        const forelderHistorikk = component.getByRole("dialog", { name: "Rollehistorikk" });
        await expect(forelderHistorikk).toBeVisible();
        await expect(forelderHistorikk.getByText(testpersoner.bidragsmottaker.visningsnavn)).toBeVisible();
        await expect(forelderHistorikk.getByText("Sak 2024/1")).toBeVisible();
        await expect(forelderHistorikk.getByRole("cell", { name: "Satt til BM manuelt" })).toBeVisible();
        await expect(forelderHistorikk.getByRole("cell", { name: "04.03.2024" })).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(forelderHistorikk).toHaveCount(0);
        await component.getByRole("button", { name: "Vis rollehistorikk" }).last().click();
        const barnHistorikk = component.getByRole("dialog", { name: "Rollehistorikk" });
        await expect(barnHistorikk.getByText(testpersoner.barn.visningsnavn)).toBeVisible();
        await expect(barnHistorikk.getByRole("cell", { name: "Endret RM manuelt" })).toBeVisible();
    });

    test("fullflyt: setter reell mottaker, legger til barn, lagrer og sender riktig request", async ({
        mount,
        page,
    }) => {
        const nyttBarn = { ident: genererFnr(), visningsnavn: "Nytt Barn", fødselsdato: "2016-05-01" };
        const { requests } = await mockSaksrollerApi(page, { personOverrides: { [nyttBarn.ident]: nyttBarn } });
        const component = await mount(STORY);

        await expect(component.getByRole("heading", { name: "Rollebilde for sak 2024/1" })).toBeVisible();
        await expect(component.getByText(testpersoner.bidragsmottaker.visningsnavn)).toBeVisible();
        await expect(component.getByText(testpersoner.bidragspliktig.visningsnavn)).toBeVisible();
        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await expect(component.getByText("Barn i saken (1)")).toBeVisible();

        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("barnet_selv");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await expect(component.getByText("Barnet selv", { exact: true })).toBeVisible();
        await expect(component.getByRole("button", { name: "Endre reell mottaker" })).toBeVisible();

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søkefelt = component.getByRole("searchbox", { name: "Søk etter barn" });
        await søkefelt.fill(nyttBarn.ident);
        await søkefelt.press("Enter");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await expect(component.getByText("Barn i saken (2)")).toBeVisible();

        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();

        await expect(component.getByText("Saken ble oppdatert")).toBeVisible();
        expect(requests.update?.saksnummer).toBe("2024/1");
        const roller = requests.update?.roller as Record<string, unknown>[];
        expect(roller).toHaveLength(4);
        expect(roller).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM" }),
                expect.objectContaining({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP" }),
                expect.objectContaining({
                    fodselsnummer: testpersoner.barn.ident,
                    type: "BA",
                    objektnummer: "1",
                    reellMottaker: { ident: testpersoner.barn.ident, verge: false },
                }),
                expect.objectContaining({
                    fodselsnummer: nyttBarn.ident,
                    type: "BA",
                    objektnummer: "",
                    reellMottaker: null,
                }),
            ]),
        );
    });

    test("viser feilmelding når lagring feiler", async ({ mount, page }) => {
        await mockSaksrollerApi(page, {
            updateStatus: 500,
            updateBody: "Kunne ikke oppdatere sak. Vennligst prøv igjen.",
        });
        const component = await mount(STORY);

        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("barnet_selv");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();

        await expect(component.getByText("Kunne ikke oppdatere sak. Vennligst prøv igjen.")).toHaveCount(1);
        await expect(component.getByText("Kunne ikke oppdatere sak. Vennligst prøv igjen.")).toBeVisible();
        await component.getByRole("button", { name: "Endre reell mottaker" }).click();
        await expect(component.getByText("Kunne ikke oppdatere sak. Vennligst prøv igjen.")).toHaveCount(0);
    });

    test("avbrutt valg av reell mottaker lagrer ingenting, og ny redigering fjerner meldingen", async ({
        mount,
        page,
    }) => {
        const { requests } = await mockSaksrollerApi(page);
        const component = await mount(STORY);

        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("barnet_selv");

        await expect(component.getByRole("dialog", { name: "Endre reell mottaker" })).toBeVisible();
        expect(requests.update).toBeFalsy();
        await component.getByRole("button", { name: "Avbryt" }).click();
        await expect(component.getByRole("dialog", { name: "Endre reell mottaker" })).toHaveCount(0);
        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();
        await expect(component.getByText("Ingen endringer å lagre.")).toBeVisible();
        expect(requests.update).toBeFalsy();

        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await expect(component.getByText("Ingen endringer å lagre.")).toHaveCount(0);
    });

    test("dagens avvik fra Favro: flere barn i farskap blokkerer også endring", async ({ mount, page }) => {
        const { requests } = await mockSaksrollerApi(page, {
            sak: lagSak({
                arbeidsfordeling: "FRS",
                roller: [
                    lagRolle({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM", rolleType: "BM" }),
                    lagRolle({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP", rolleType: "BP" }),
                    lagRolle({ fodselsnummer: testpersoner.barn.ident, type: "BA", rolleType: "BA" }),
                    lagRolle({ fodselsnummer: genererFnr(), type: "BA", rolleType: "BA", objektnummer: "2" }),
                ],
            }),
        });
        const component = await mount(STORY);

        await expect(component.getByText("Farskap", { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).first().click();
        await component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("barnet_selv");
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();

        await expect(component.getByText("En farskapssak kan bare gjelde ett barn.")).toBeVisible();
        expect(requests.update).toBeFalsy();
    });

    test("skjuler barneseksjonen for ektefellebidragssaker", async ({ mount, page }) => {
        await mockSaksrollerApi(page, {
            sak: lagSak({
                arbeidsfordeling: "EFS",
                roller: [
                    { fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM", rolleType: "BM" },
                    { fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP", rolleType: "BP" },
                ],
            }),
        });
        const component = await mount(STORY);

        await expect(component.getByText("Ektefellebidrag", { exact: true })).toBeVisible();
        await expect(
            component.getByText("Dette er en ektefellebidragssak og inneholder ikke barn. Saken kan ikke redigeres."),
        ).toBeVisible();
        await expect(component.getByText("Barn i saken")).toHaveCount(0);
    });
});
