import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import type { Page } from "@playwright/test";

const STORY = "routes/sak/saksroller/barn-rolle/LeggTilBarn/MedBidragsmottaker";

async function mockPersonInformasjonFørMount(
    page: Page,
    svar: Record<string, { ident: string; visningsnavn: string; fødselsdato?: string }>,
) {
    await page.route("**/proxy/bidrag-person/informasjon/", async (route) => {
        const requestIdent = (route.request().postDataJSON() as { ident: string }).ident;
        const treff = svar[requestIdent];
        if (!treff) {
            await route.fulfill({ status: 404, json: { message: "Fant ikke person" } });
            return;
        }
        await route.fulfill({ json: treff });
    });
}

test.describe("LeggTilBarn", () => {
    test("fullflyt: krever søk, forkaster gammelt treff ved nytt søk og legger til funnet barn", async ({
        mount,
        page,
    }) => {
        const barnIdent = genererFnr();
        const ukjentIdent = genererFnr();
        await mockPersonInformasjonFørMount(page, {
            [barnIdent]: { ident: barnIdent, visningsnavn: "Lite Barn", fødselsdato: "2015-01-01" },
        });
        const component = await mount(STORY);
        const dialog = component.getByRole("dialog", { name: "Legg til nytt barn i saken" });
        const søkefelt = component.getByRole("searchbox", { name: "Søk etter barn" });
        const leggTil = component.getByRole("button", { name: "Legg til", exact: true });

        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await expect(dialog).toBeVisible();
        await leggTil.click();
        await expect(component.getByText("Søk opp barnet med fødselsnummer eller D-nummer først")).toBeVisible();

        await søkefelt.fill(barnIdent);
        await component.getByRole("button", { name: "Søk", exact: true }).click();
        await expect(component.getByText("Lite Barn")).toBeVisible();
        await expect(component.getByText("Bruker nyeste fødselsnummer")).toHaveCount(0);

        await søkefelt.fill(ukjentIdent);
        await expect(component.getByText("Lite Barn")).toHaveCount(0);
        await søkefelt.press("Enter");
        await expect(component.getByText("Finnes ingen person eller samhandler med oppgitt ident")).toHaveCount(1);
        await leggTil.click();
        await expect(dialog).toBeVisible();

        await søkefelt.fill(barnIdent);
        await søkefelt.press("Enter");
        await expect(component.getByText("Lite Barn")).toBeVisible();
        await leggTil.click();
        await expect(dialog).toHaveCount(0);
    });

    test("viser info om nyeste fødselsnummer når personen har fått nytt fødselsnummer", async ({ mount, page }) => {
        const gammelIdent = genererFnr();
        const nyIdent = genererFnr();
        await mockPersonInformasjonFørMount(page, {
            [gammelIdent]: { ident: nyIdent, visningsnavn: "Lite Barn", fødselsdato: "2015-01-01" },
        });

        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await component.getByRole("searchbox", { name: "Søk etter barn" }).fill(gammelIdent);
        await component.getByRole("searchbox", { name: "Søk etter barn" }).press("Enter");

        await expect(component.getByText(`Bruker nyeste fødselsnummer ${nyIdent}`)).toBeVisible();
        await expect(component.getByText("Lite Barn")).toBeVisible();
    });
});
