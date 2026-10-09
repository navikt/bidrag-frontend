import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import type { Locator, Page } from "@playwright/test";
import { barnkurver, testpersoner } from "../../../playwright/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockOpprettSakApi } from "../../../playwright/opprett-ny-sak/network";
import type { Modal } from "./OpprettSakFlytModal.story";

const STORY = "opprett-ny-sak/start/OpprettSakFlytModal/Modal";
const { bidragspliktig: bp, bidragsmottaker: bm, barnUnder18 } = testpersoner;
const foreldreTilBarn = { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } };

async function åpneModal(page: Page, component: Locator) {
    await component.getByRole("button", { name: "Åpne opprett sak" }).click();
    const dialog = page.getByRole("dialog", { name: "Opprett sak" });
    await expect(dialog).toBeVisible();
    return dialog;
}

test.describe("Opprett sak som modal fra behandling og dokument", () => {
    test("forhåndsutfyller barn og BP, sender riktig request og gir saksnummeret tilbake", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page, foreldreTilBarn);
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            initialForelderIdent: bp.ident,
            eierfogd: "4806",
        });
        const url = page.url();
        const dialog = await åpneModal(page, component);

        await expect(dialog.getByRole("heading", { name: "Opprett ny sak" })).toHaveCount(0);
        await expect(dialog.getByRole("group", { name: "Bidragspliktig" }).getByText(bp.visningsnavn)).toBeVisible();
        await expect(dialog.getByRole("group", { name: "Bidragsmottaker" }).getByText(bm.visningsnavn)).toBeVisible();
        await expect(dialog.getByText("Låst", { exact: true })).toHaveCount(1);
        await expect(dialog.getByRole("group", { name: "Bidragspliktig", exact: true }).getByText("Låst")).toHaveCount(
            0,
        );
        await expect(dialog.getByText(/Arbeidsfordelingen gir en annen enhet/)).toHaveCount(0);
        await expect(dialog.getByRole("button", { name: "Opprett og ny søknad" })).toHaveCount(0);
        await expect(dialog.getByRole("button", { name: "Opprett og gå til sak" })).toHaveCount(0);
        const opprett = dialog.getByRole("button", { name: /Opprett$/ });
        await expect(opprett).toBeVisible();
        await expect(dialog.locator(".aksel-modal__footer").getByRole("button", { name: /Opprett$/ })).toBeVisible();
        expect(await opprett.evaluate((button: HTMLButtonElement) => button.form?.tagName)).toBe("FORM");
        await expectNoAxeViolations(page, component);

        await opprett.click();

        await expect.poll(() => requests.create).toBeTruthy();
        expect(requests.create).toMatchObject({ eierfogd: "4806", kategori: "N", arbeidsfordeling: "EEN" });
        expect(requests.create?.roller).toEqual([
            expect.objectContaining({ fodselsnummer: bp.ident, type: "BP" }),
            expect.objectContaining({ fodselsnummer: bm.ident, type: "BM" }),
            expect.objectContaining({ fodselsnummer: barnUnder18.ident, type: "BA" }),
        ]);
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
        await expect(component.getByTestId("ytre-skjema-innsendt")).toHaveValue("false");
        expect(page.url()).toBe(url);
        await expect(dialog).toBeHidden();
        await expect(component.getByTestId("lukket")).toHaveValue("false");
    });

    test("uten rolle velges rollen for personen som ble sendt med, uten søk", async ({ mount, page }) => {
        await mockOpprettSakApi(page);
        const component = await mount<typeof Modal>(STORY, { ident: bp.ident, eierfogd: "4806" });
        const dialog = await åpneModal(page, component);

        await expect(dialog.getByRole("heading", { name: "Velg rolle" })).toBeVisible();
        await expect(dialog.getByRole("searchbox")).toHaveCount(0);
        await expect(dialog.getByText(bp.visningsnavn).first()).toBeVisible();
        const rollevalg = dialog.getByRole("radiogroup", { name: /Hvilken rolle har/ });
        for (const radio of await rollevalg.getByRole("radio").all()) {
            await expect(radio).not.toBeChecked();
        }
        await expect(dialog.getByRole("button", { name: /Opprett$/ })).toHaveCount(0);
        await expectNoAxeViolations(page, component);

        await rollevalg.getByRole("radio", { name: "Bidragspliktig" }).click();

        await expect(dialog.getByRole("heading", { name: "Velg rolle" })).toHaveCount(0);
        const bpKort = dialog.getByRole("group", { name: "Bidragspliktig" });
        await expect(bpKort.getByText(bp.visningsnavn)).toBeVisible();
        await expect(bpKort.getByText("Låst", { exact: true })).toBeVisible();
        await expect(dialog.getByRole("radiogroup", { name: "Kategori" })).toBeVisible();
        await expect(dialog.getByRole("heading", { name: "Kategori" })).toHaveCount(0);
        await expect(dialog.getByRole("radio", { name: "Nasjonal" })).toBeChecked();
    });

    test("barn sendt med som BA gir skjemaet direkte, uten rollevalg, og barnet er låst", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page, foreldreTilBarn);
        await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
            await route.fulfill({ json: { person: bp, personensMotpartBarnRelasjon: barnkurver } });
        });
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            eierfogd: "4806",
        });
        const dialog = await åpneModal(page, component);

        await expect(dialog.getByRole("heading", { name: "Velg rolle" })).toHaveCount(0);
        await expect(dialog.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
        await expect(dialog.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);

        const barn = dialog.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });
        await expect(barn).toBeChecked();
        await barn.click({ force: true });
        await expect(barn).toBeChecked();
        await expect(dialog.getByText("Låst", { exact: true })).toHaveCount(1);
        await expect(dialog.getByRole("group", { name: "Bidragspliktig", exact: true }).getByText("Låst")).toHaveCount(
            0,
        );
        await expect(dialog.getByRole("group", { name: "Bidragsmottaker", exact: true }).getByText("Låst")).toHaveCount(
            0,
        );
        await expectNoAxeViolations(page, component);

        await dialog
            .getByRole("group", { name: "Bidragspliktig", exact: true })
            .getByRole("combobox", { name: "Velg bidragspliktig" })
            .selectOption({ label: bp.visningsnavn });

        await expect(dialog.getByText(/ukjent forelder/i)).toHaveCount(0);
        const kurv = dialog.getByRole("group", { name: `Velg barn med ${bm.visningsnavn}` });
        await expect(kurv.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` })).toBeChecked();
        await expect(kurv.getByText("Låst", { exact: true })).toBeVisible();

        await dialog.getByRole("button", { name: /Opprett$/ }).click();

        await expect.poll(() => requests.create).toBeTruthy();
        expect(requests.create?.roller).toEqual(
            expect.arrayContaining([expect.objectContaining({ fodselsnummer: barnUnder18.ident, type: "BA" })]),
        );
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
    });

    test("barn uten valgte foreldre vises under «Foreldre ikke valgt», ikke som ukjent forelder", async ({
        mount,
        page,
    }) => {
        await mockOpprettSakApi(page);
        const component = await mount<typeof Modal>(STORY, { ident: barnUnder18.ident, rolle: "BA" });
        const dialog = await åpneModal(page, component);

        const gruppe = dialog.getByRole("group", { name: "Foreldre ikke valgt" });
        await expect(gruppe.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` })).toBeChecked();
        await expect(dialog.getByText(/ukjent forelder/i)).toHaveCount(0);
        await expect(dialog.getByText("Barn lagt til manuelt")).toHaveCount(0);
    });

    test("barn som ikke er felles barn med valgte foreldre vises under «Ikke registrert som felles barn»", async ({
        mount,
        page,
    }) => {
        await mockOpprettSakApi(page, foreldreTilBarn);
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            initialForelderIdent: bp.ident,
        });
        const dialog = await åpneModal(page, component);

        await expect(dialog.getByRole("group", { name: "Bidragspliktig" }).getByText(bp.visningsnavn)).toBeVisible();
        const gruppe = dialog.getByRole("group", { name: "Ikke registrert som felles barn" });
        await expect(gruppe.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` })).toBeChecked();
        await expect(dialog.getByText(/ukjent forelder/i)).toHaveCount(0);
    });

    test("viser at barn hentes mens barnlistene lastes", async ({ mount, page }) => {
        await mockOpprettSakApi(page, foreldreTilBarn);
        const ventende: (() => void)[] = [];
        let sluppet = false;
        const svar = () => {
            sluppet = true;
            for (const slipp of ventende.splice(0)) slipp();
        };
        await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
            if (!sluppet) await new Promise<void>((resolve) => ventende.push(resolve));
            await route.fulfill({ json: { person: bp, personensMotpartBarnRelasjon: barnkurver } });
        });
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            initialForelderIdent: bp.ident,
        });
        const dialog = await åpneModal(page, component);

        await expect(dialog.getByRole("status").filter({ hasText: "Henter barn..." })).toBeVisible();
        await expect(dialog.getByText(/ukjent forelder/i)).toHaveCount(0);

        svar();

        await expect(dialog.getByText("Henter barn...")).toHaveCount(0);
        const kurv = dialog.getByRole("group", { name: `Velg barn med ${bm.visningsnavn}` });
        await expect(kurv.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` })).toBeChecked();
    });

    test("barn uten rolle får rollevalg først, uten foreldreroller", async ({ mount, page }) => {
        await mockOpprettSakApi(page, foreldreTilBarn);
        const component = await mount<typeof Modal>(STORY, { ident: barnUnder18.ident, eierfogd: "4806" });
        const dialog = await åpneModal(page, component);

        const rollevalg = dialog.getByRole("radiogroup", { name: /Hvilken rolle har/ });
        await expect(rollevalg.getByRole("radio", { name: "Bidragspliktig" })).toHaveCount(0);
        await rollevalg.getByRole("radio", { name: "Barn under 18 år" }).click();

        await expect(rollevalg).toHaveCount(0);
        await expect(dialog.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` })).toBeChecked();
    });

    test("viser feil fra backend i modalen og lar den stå åpen", async ({ mount, page }) => {
        await mockOpprettSakApi(page, { ...foreldreTilBarn, createStatus: 500, createBody: "Kunne ikke opprette sak" });
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            initialForelderIdent: bp.ident,
        });
        const dialog = await åpneModal(page, component);

        await dialog.getByRole("button", { name: /Opprett$/ }).click();

        await expect(dialog.getByText("Kunne ikke opprette sak")).toBeVisible();
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("");
    });

    test("viser valideringsfeil i modalen uten å sende inn", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page);
        const component = await mount<typeof Modal>(STORY, { ident: barnUnder18.ident, rolle: "BA" });
        const dialog = await åpneModal(page, component);

        await dialog.getByRole("button", { name: /Opprett$/ }).click();

        await expect(dialog.getByText("Du må registrere bidragspliktig eller velge ukjent")).toBeVisible();
        expect(requests.create).toBeUndefined();
    });

    test("Avbryt lukker modalen uten å opprette sak", async ({ mount, page }) => {
        const requests = await mockOpprettSakApi(page, foreldreTilBarn);
        const component = await mount<typeof Modal>(STORY, { ident: barnUnder18.ident, rolle: "BA" });
        const dialog = await åpneModal(page, component);

        await dialog.getByRole("button", { name: "Avbryt" }).click();

        await expect(dialog).toBeHidden();
        await expect(component.getByTestId("lukket")).toHaveValue("true");
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("");
        expect(requests.create).toBeUndefined();
    });

    test("modalen kan ikke lukkes mens saken sendes inn", async ({ mount, page }) => {
        await mockOpprettSakApi(page, foreldreTilBarn);
        let svar: () => void = () => undefined;
        await page.route(/\/proxy\/bidrag-sak\/sak$/, async (route) => {
            await new Promise<void>((resolve) => {
                svar = resolve;
            });
            await route.fulfill({ json: { saksnummer: "1234567" } });
        });
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            initialForelderIdent: bp.ident,
        });
        const dialog = await åpneModal(page, component);

        await dialog.getByRole("button", { name: /Opprett$/ }).click();
        await expect(dialog.getByRole("button", { name: "Avbryt" })).toBeDisabled();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeVisible();
        await expect(component.getByTestId("lukket")).toHaveValue("false");

        svar();
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
    });

    test("viser avvik når arbeidsfordelingen gir en annen enhet enn eierfogd", async ({ mount, page }) => {
        await mockOpprettSakApi(page, foreldreTilBarn);
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            initialForelderIdent: bp.ident,
            eierfogd: "9999",
        });
        const dialog = await åpneModal(page, component);

        await expect(
            dialog.getByText("Arbeidsfordelingen gir en annen enhet enn 9999.", { exact: false }),
        ).toBeVisible();
    });
});
