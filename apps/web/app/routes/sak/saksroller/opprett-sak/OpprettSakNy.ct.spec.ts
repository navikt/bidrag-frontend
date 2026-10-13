import type { OpprettSakRequest } from "@bidrag/api/SakApi";
import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import type { Page } from "@playwright/test";
import type { Behandling } from "./OpprettSakLegacy.story";

const person = { ident: genererFnr(), visningsnavn: "Test Mottaker", fødselsdato: "1987-06-21" };
const motpart = { ident: genererFnr(), visningsnavn: "Test Pliktig", fødselsdato: "1985-02-14" };
const barn = { ident: genererFnr(), visningsnavn: "Test Barn", fødselsdato: "2015-04-12" };

async function mockOpprettSak(page: Page, feil = false) {
    const requests: OpprettSakRequest[] = [];
    await page.route("**/proxy/bidrag-sak/sak", async (route) => {
        requests.push(route.request().postDataJSON());
        await route.fulfill({
            status: feil ? 500 : 200,
            json: feil ? "Kunne ikke opprette testsak" : { saksnummer: "1234567" },
        });
    });
    return requests;
}

async function velgBarnOgOpprett(page: Page) {
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("checkbox", { name: `Velg ${barn.visningsnavn}`, exact: true }).check();
    await expect(
        dialog.getByRole("group", { name: "Bidragspliktig", exact: true }).getByText(motpart.visningsnavn),
    ).toBeVisible();
    await dialog.getByRole("button", { name: /Opprett$/ }).click();
}

function kontrollerRequest(requests: OpprettSakRequest[]) {
    expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual({
        eierfogd: "4806",
        kategori: "N",
        arbeidsfordeling: "EEN",
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
        roller: [
            {
                fodselsnummer: motpart.ident,
                type: "BP",
                rolleType: "BP",
                mottagerErVerge: false,
                reellMottaker: null,
            },
            {
                fodselsnummer: person.ident,
                type: "BM",
                rolleType: "BM",
                mottagerErVerge: false,
                reellMottaker: null,
            },
            {
                fodselsnummer: barn.ident,
                type: "BA",
                rolleType: "BA",
                mottagerErVerge: false,
                reellMottaker: null,
            },
        ],
    });
}

for (const inngang of ["Behandling", "Dokument"] as const) {
    test.describe(`Ny flyt fra ${inngang}, flagg på`, () => {
        test.beforeEach(async ({ mount, page }) => {
            await page.route("**/log/**", (route) => route.fulfill({ status: 204 }));
            await page.route(/\/proxy\/bidrag-person\/informasjon\/?$/, (route) => {
                const { ident } = route.request().postDataJSON();
                return route.fulfill({ json: [person, motpart, barn].find((p) => p.ident === ident) });
            });
            await page.route("**/proxy/bidrag-person/motpartbarnrelasjon", (route) => {
                const { ident } = route.request().postDataJSON();
                return route.fulfill({
                    json: {
                        person: ident === motpart.ident ? motpart : person,
                        personensMotpartBarnRelasjon: [
                            {
                                motpart: ident === motpart.ident ? person : motpart,
                                fellesBarn: [barn],
                                forelderrolleMotpart: ident === motpart.ident ? "MOR" : "FAR",
                            },
                        ],
                    },
                });
            });
            await page.route("**/proxy/bidrag-person/forelderbarnrelasjon", (route) =>
                route.fulfill({
                    json: {
                        forelderBarnRelasjon: [person, motpart].map((p) => ({
                            minRolleForPerson: "BARN",
                            relatertPersonsIdent: p.ident,
                        })),
                    },
                }),
            );
            await page.route("**/proxy/bidrag-sak/person/sak", (route) => route.fulfill({ json: [] }));
            await page.route("**/proxy/bidrag-organisasjon/arbeidsfordeling/enhet/geografisktilknytning", (route) =>
                route.fulfill({ json: { nummer: "4806", navn: "Nav Test" } }),
            );
            await page.route("**/proxy/bidrag-tilgangskontroll/v2/api/tilgang/opprettsakutenbm", (route) =>
                route.fulfill({ json: { harTilgang: false } }),
            );
            const component = await mount<typeof Behandling>(
                `routes/sak/saksroller/opprett-sak/OpprettSakLegacy/${inngang}`,
                { person, motpart, barn, nyFlyt: true },
            );
            await component
                .getByRole("button", { name: inngang === "Behandling" ? "Opprett sak" : "Åpne opprett sak" })
                .click();
            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();
            await expect(dialog.getByTestId("test-opprettsak-mainperson-role")).toHaveCount(0);
            if (inngang === "Dokument") {
                await dialog.getByRole("radio", { name: "Bidragsmottaker", exact: true }).click();
            }
        });

        test("oppretter sak og lukker modalen", async ({ page }) => {
            const requests = await mockOpprettSak(page);
            await velgBarnOgOpprett(page);
            await expect(page.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
            await expect(page.getByRole("dialog")).toBeHidden();
            kontrollerRequest(requests);
        });

        test("avbryter uten å opprette sak", async ({ page }) => {
            const requests = await mockOpprettSak(page);
            const dialog = page.getByRole("dialog");
            await dialog.getByRole("button", { name: "Avbryt", exact: true }).click();
            await expect(dialog).toBeHidden();
            await expect(page.getByTestId("opprettet-saksnummer")).toHaveValue("");
            expect(requests).toEqual([]);
        });

        test("viser backend-feil og holder modalen åpen", async ({ page }) => {
            const requests = await mockOpprettSak(page, true);
            await velgBarnOgOpprett(page);
            const dialog = page.getByRole("dialog");
            await expect(dialog.getByText("Kunne ikke opprette sak", { exact: true })).toBeVisible();
            await expect(dialog).toBeVisible();
            await expect(page.getByTestId("opprettet-saksnummer")).toHaveValue("");
            kontrollerRequest(requests);
        });
    });
}
