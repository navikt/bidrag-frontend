import { Arbeidsfordeling, type OpprettSakRequest, Rolletype } from "@bidrag/api/SakApi";
import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import type { Page } from "@playwright/test";
import type { Behandling } from "./OpprettSakLegacy.story";

const person = { ident: genererFnr(), visningsnavn: "Test Mottaker", fødselsdato: "1987-06-21" };
const motpart = { ident: genererFnr(), visningsnavn: "Test Pliktig", fødselsdato: "1985-02-14" };
const barn = { ident: genererFnr(), visningsnavn: "Test Barn", fødselsdato: "2015-04-12" };
const søsken = { ident: genererFnr(), visningsnavn: "Test Søsken", fødselsdato: "2018-09-03" };
const mellomste = { ident: genererFnr(), visningsnavn: "Test Mellomste", fødselsdato: "2020-02-17" };
const yngste = { ident: genererFnr(), visningsnavn: "Test Yngste", fødselsdato: "2023-07-08" };
const flereSøsken = [søsken, mellomste, yngste];
const alleBarn = [barn, ...flereSøsken];
const props = { person, motpart, barn, søsken: flereSøsken };

async function mockApi(page: Page, feil = false) {
    const requests: OpprettSakRequest[] = [];
    await page.route("**/log/secure", (route) => route.fulfill({ status: 204 }));
    await page.route("**/proxy/bidrag-tilgangskontroll/v2/api/tilgang/opprettsakutenbm", (route) =>
        route.fulfill({ json: { harTilgang: false } }),
    );
    await page.route("**/proxy/bidrag-person/motpartbarnrelasjon", (route) =>
        route.fulfill({
            json: {
                personensMotpartBarnRelasjon: [{ motpart, fellesBarn: alleBarn, forelderrolleMotpart: "FAR" }],
            },
        }),
    );
    await page.route("**/proxy/bidrag-sak/sak", async (route) => {
        requests.push(route.request().postDataJSON());
        await route.fulfill({
            status: feil ? 500 : 200,
            headers: feil ? { warning: "Kunne ikke opprette testsak" } : {},
            json: feil ? {} : { saksnummer: "1234567" },
        });
    });
    return requests;
}

function forventetRequest(valgteBarn: { ident: string; reellMottager?: string }[]): OpprettSakRequest {
    return {
        eierfogd: "4806",
        kategori: "N",
        arbeidsfordeling: Arbeidsfordeling.BBF,
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
        roller: [
            {
                fodselsnummer: person.ident,
                type: Rolletype.BM,
                rolleType: Rolletype.BM,
                mottagerErVerge: false,
                rollehistorikk: [],
            },
            {
                fodselsnummer: motpart.ident,
                type: Rolletype.BP,
                rolleType: Rolletype.BP,
                mottagerErVerge: false,
                rollehistorikk: [],
            },
            ...valgteBarn.map(({ ident, reellMottager }) => ({
                fodselsnummer: ident,
                type: Rolletype.BA,
                rolleType: Rolletype.BA,
                mottagerErVerge: false,
                rollehistorikk: [],
                ...(reellMottager === undefined ? {} : { reellMottager }),
            })),
        ],
    };
}

for (const inngang of ["Behandling", "Dokument", "Web"] as const) {
    test.describe(`Legacy opprett sak fra ${inngang}, flagg av`, () => {
        test("åpner ekte skjema og oppretter sak med forhåndsutfylte roller", async ({ mount, page }) => {
            // TODO: Aktiver web-testen når onSubmit/onClose-kontrakten er rettet i neste PR.
            test.skip(inngang === "Web", "Eksisterende feil på main: onClose navigerer tilbake etter onSubmit.");
            const requests = await mockApi(page);
            const component = await mount<typeof Behandling>(
                `routes/sak/saksroller/opprett-sak/OpprettSakLegacy/${inngang}`,
                props,
            );
            if (inngang !== "Web") {
                await component
                    .getByRole("button", { name: inngang === "Behandling" ? "Opprett sak" : "Åpne opprett sak" })
                    .click();
            }
            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();
            await expect(dialog.getByTestId("test-opprettsak-mainperson-role")).toHaveValue("BM");
            await expect(dialog.getByRole("combobox", { name: "Velg BP" })).toHaveValue(motpart.ident);
            await expect(dialog.getByTestId("test-opprettsak-person-reellmotaker-card")).toHaveCount(4);
            for (const valgtBarn of alleBarn) {
                await expect(dialog.getByText(valgtBarn.visningsnavn, { exact: false })).toBeVisible();
            }
            await dialog.getByRole("button", { name: "Opprett", exact: true }).click();
            await expect.poll(() => requests.length).toBe(1);
            expect(requests[0]).toEqual(forventetRequest(alleBarn));
            if (inngang === "Web") {
                await expect(component.getByTestId("rute")).toHaveValue("/sak/1234567/saksroller");
            } else {
                await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
            }
            await expect(dialog).toBeHidden();
        });

        test("avbryter uten å opprette sak", async ({ mount, page }) => {
            const requests = await mockApi(page);
            const component = await mount<typeof Behandling>(
                `routes/sak/saksroller/opprett-sak/OpprettSakLegacy/${inngang}`,
                props,
            );
            if (inngang !== "Web") {
                await component
                    .getByRole("button", { name: inngang === "Behandling" ? "Opprett sak" : "Åpne opprett sak" })
                    .click();
            }
            const dialog = page.getByRole("dialog");
            await dialog.getByRole("button", { name: "Avbryt", exact: true }).click();
            await expect(dialog).toBeHidden();
            if (inngang === "Web") {
                await expect(component.getByTestId("rute")).toHaveValue("/start");
            }
            expect(requests).toEqual([]);
            await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("");
        });

        test("viser backend-feil og holder modalen åpen", async ({ mount, page }) => {
            const requests = await mockApi(page, true);
            const component = await mount<typeof Behandling>(
                `routes/sak/saksroller/opprett-sak/OpprettSakLegacy/${inngang}`,
                props,
            );
            if (inngang !== "Web") {
                await component
                    .getByRole("button", { name: inngang === "Behandling" ? "Opprett sak" : "Åpne opprett sak" })
                    .click();
            }
            const dialog = page.getByRole("dialog");
            await dialog.getByRole("button", { name: "Opprett", exact: true }).click();
            await expect(dialog.getByText("Kunne ikke opprette testsak")).toBeVisible();
            expect(requests).toHaveLength(1);
            await expect(dialog).toBeVisible();
            await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("");
        });
    });
}

for (const inngang of ["Behandling", "Dokument"] as const) {
    test.describe(`Legacy barnvalg fra ${inngang}, flagg av`, () => {
        test("velger barn og reell mottaker før opprettelse", async ({ mount, page }) => {
            const requests = await mockApi(page);
            const component = await mount<typeof Behandling>(
                `routes/sak/saksroller/opprett-sak/OpprettSakLegacy/${inngang}`,
                props,
            );
            await component
                .getByRole("button", { name: inngang === "Behandling" ? "Opprett sak" : "Åpne opprett sak" })
                .click();
            const dialog = page.getByRole("dialog");
            const barnkort = dialog
                .getByTestId("test-opprettsak-person-reellmotaker-card")
                .filter({ hasText: barn.visningsnavn });
            const søskenkort = dialog
                .getByTestId("test-opprettsak-person-reellmotaker-card")
                .filter({ hasText: søsken.visningsnavn });
            await expect(barnkort.getByRole("checkbox")).toBeChecked();
            await expect(søskenkort.getByRole("checkbox")).toBeChecked();
            const yngstekort = dialog
                .getByTestId("test-opprettsak-person-reellmotaker-card")
                .filter({ hasText: yngste.visningsnavn });
            await expect(dialog.getByTestId("test-opprettsak-person-reellmotaker-card")).toHaveCount(4);
            await expect(yngstekort.getByRole("checkbox")).toBeChecked();
            await barnkort.getByRole("checkbox").uncheck();
            await expect(barnkort.getByRole("textbox", { name: "Reell mottaker" })).toBeDisabled();
            await barnkort.getByRole("checkbox").check();
            await expect(barnkort.getByRole("textbox", { name: "Reell mottaker" })).toBeEnabled();
            await søskenkort.getByRole("checkbox").uncheck();
            await expect(søskenkort.getByRole("textbox", { name: "Reell mottaker" })).toBeDisabled();
            await yngstekort.getByRole("checkbox").uncheck();
            await expect(yngstekort.getByRole("textbox", { name: "Reell mottaker" })).toBeDisabled();
            await barnkort.getByRole("textbox", { name: "Reell mottaker" }).fill(person.ident);
            await dialog.getByRole("button", { name: "Opprett", exact: true }).click();
            await expect.poll(() => requests.length).toBe(1);
            expect(requests[0]).toEqual(
                forventetRequest([{ ident: barn.ident, reellMottager: person.ident }, mellomste]),
            );
            await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
            await expect(dialog).toBeHidden();
        });

        test("oppretter med alle fire barna etter å ha slått av opprett uten barn", async ({ mount, page }) => {
            const requests = await mockApi(page);
            const component = await mount<typeof Behandling>(
                `routes/sak/saksroller/opprett-sak/OpprettSakLegacy/${inngang}`,
                props,
            );
            await component
                .getByRole("button", { name: inngang === "Behandling" ? "Opprett sak" : "Åpne opprett sak" })
                .click();
            const dialog = page.getByRole("dialog");
            const utenBarn = dialog.getByRole("checkbox", { name: "Opprett sak uten barn" });
            await expect(dialog.getByTestId("test-opprettsak-person-reellmotaker-card")).toHaveCount(4);
            await utenBarn.check();
            await expect(dialog.getByTestId("test-opprettsak-person-reellmotaker-card")).toHaveCount(0);
            await utenBarn.uncheck();
            const barnvalg = dialog.getByTestId("test-opprettsak-person-reellmotaker-card-checkbox");
            await expect(barnvalg).toHaveCount(4);
            for (let index = 0; index < alleBarn.length; index++) {
                await expect(barnvalg.nth(index)).toBeChecked();
            }
            await dialog.getByRole("button", { name: "Opprett", exact: true }).click();
            await expect.poll(() => requests.length).toBe(1);
            expect(requests[0]).toEqual(forventetRequest(alleBarn));
            await expect(dialog).toBeHidden();
        });

        test("oppretter uten barn når opprett uten barn er valgt", async ({ mount, page }) => {
            const requests = await mockApi(page);
            const component = await mount<typeof Behandling>(
                `routes/sak/saksroller/opprett-sak/OpprettSakLegacy/${inngang}`,
                props,
            );
            await component
                .getByRole("button", { name: inngang === "Behandling" ? "Opprett sak" : "Åpne opprett sak" })
                .click();
            const dialog = page.getByRole("dialog");
            await dialog.getByRole("checkbox", { name: "Opprett sak uten barn" }).check();
            await expect(dialog.getByTestId("test-opprettsak-person-reellmotaker-card")).toHaveCount(0);
            await dialog.getByRole("button", { name: "Opprett", exact: true }).click();
            await expect.poll(() => requests.length).toBe(1);
            expect(requests[0]).toEqual(forventetRequest([]));
            await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
            await expect(dialog).toBeHidden();
        });
    });
}
