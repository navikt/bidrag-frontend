import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import type { Locator, Page } from "@playwright/test";
import type { Modal } from "./OpprettSakFlytModal.story";

const STORY = "routes/sak/saksroller/opprett-ny-sak/start/OpprettSakFlytModal/Modal";
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
        const requests = await mockWizardApi(page, foreldreTilBarn);
        const component = await mount<typeof Modal>(STORY, {
            ident: barnUnder18.ident,
            rolle: "BA",
            initialForelderIdent: bp.ident,
            eierfogd: "4806",
        });
        const dialog = await åpneModal(page, component);

        await expect(dialog.getByRole("heading", { name: "Opprett ny sak" })).toHaveCount(0);
        await expect(dialog.getByRole("group", { name: "Bidragspliktig" }).getByText(bp.visningsnavn)).toBeVisible();
        await expect(dialog.getByRole("group", { name: "Bidragsmottaker" }).getByText(bm.visningsnavn)).toBeVisible();
        await expect(dialog.getByText(/Arbeidsfordelingen gir en annen enhet/)).toHaveCount(0);
        await expectNoAxeViolations(page, component);

        await dialog.getByRole("button", { name: /Opprett$/ }).click();

        await expect.poll(() => requests.create).toBeTruthy();
        expect(requests.create).toMatchObject({ eierfogd: "4806", kategori: "N", arbeidsfordeling: "EEN" });
        expect(requests.create?.roller).toEqual([
            expect.objectContaining({ fodselsnummer: bp.ident, type: "BP" }),
            expect.objectContaining({ fodselsnummer: bm.ident, type: "BM" }),
            expect.objectContaining({ fodselsnummer: barnUnder18.ident, type: "BA" }),
        ]);
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
        await expect(dialog).toBeHidden();
        await expect(component.getByTestId("lukket")).toHaveValue("false");
    });

    test("Avbryt lukker modalen uten å opprette sak", async ({ mount, page }) => {
        const requests = await mockWizardApi(page, foreldreTilBarn);
        const component = await mount<typeof Modal>(STORY, { ident: barnUnder18.ident, rolle: "BA" });
        const dialog = await åpneModal(page, component);

        await dialog.getByRole("button", { name: "Avbryt" }).click();

        await expect(dialog).toBeHidden();
        await expect(component.getByTestId("lukket")).toHaveValue("true");
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("");
        expect(requests.create).toBeUndefined();
    });

    test("Avbryt er sperret mens saken sendes inn", async ({ mount, page }) => {
        await mockWizardApi(page, foreldreTilBarn);
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

        svar();
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("1234567");
    });

    test("viser avvik når arbeidsfordelingen gir en annen enhet enn eierfogd", async ({ mount, page }) => {
        await mockWizardApi(page, foreldreTilBarn);
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

    test("uten ny flyt vises ingen ny modal", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount<typeof Modal>(STORY, { ident: barnUnder18.ident, medNyFlyt: false });

        await component.getByRole("button", { name: "Åpne opprett sak" }).click();

        await expect(page.getByRole("dialog")).toHaveCount(0);
    });
});
