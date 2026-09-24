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
    test("søk med Enter viser treffet til bekreftelse, og Legg til fullfører uten å måtte klikke søkeknapp", async ({
        mount,
        page,
    }) => {
        const barnIdent = genererFnr();
        await mockPersonInformasjonFørMount(page, {
            [barnIdent]: { ident: barnIdent, visningsnavn: "Lite Barn", fødselsdato: "2015-01-01" },
        });

        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await expect(component.getByRole("dialog", { name: "Legg til nytt barn i saken" })).toBeVisible();
        await component.getByRole("searchbox", { name: "Søk etter barn" }).fill(barnIdent);
        await component.getByRole("searchbox", { name: "Søk etter barn" }).press("Enter");

        await expect(component.getByText("Lite Barn")).toBeVisible();

        await component.getByRole("button", { name: "Legg til", exact: true }).click();

        await expect(component.getByRole("heading", { name: "Legg til nytt barn i saken" })).toHaveCount(0);
    });

    test("søk fungerer også ved klikk på søkeknappen, ikke bare Enter", async ({ mount, page }) => {
        const barnIdent = genererFnr();
        await mockPersonInformasjonFørMount(page, {
            [barnIdent]: { ident: barnIdent, visningsnavn: "Lite Barn", fødselsdato: "2015-01-01" },
        });

        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await component.getByRole("searchbox", { name: "Søk etter barn" }).fill(barnIdent);
        await component.getByRole("button", { name: "Søk", exact: true }).click();

        await expect(component.getByText("Lite Barn")).toBeVisible();
    });

    test("viser feilmelding hvis Legg til trykkes før det er søkt opp noen", async ({ mount }) => {
        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await component.getByRole("button", { name: "Legg til", exact: true }).click();

        await expect(component.getByText("Søk opp barnet med fødselsnummer eller D-nummer først")).toBeVisible();
    });

    test("legger ikke til forrige treff når søket endres eller neste søk feiler", async ({ mount, page }) => {
        const barnIdent = genererFnr();
        const ukjentIdent = genererFnr();
        await mockPersonInformasjonFørMount(page, {
            [barnIdent]: { ident: barnIdent, visningsnavn: "Lite Barn", fødselsdato: "2015-01-01" },
        });

        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        const søkefelt = component.getByRole("searchbox", { name: "Søk etter barn" });
        await søkefelt.fill(barnIdent);
        await søkefelt.press("Enter");
        await expect(component.getByText("Lite Barn")).toBeVisible();

        await søkefelt.fill(ukjentIdent);
        await expect(component.getByText("Lite Barn")).toHaveCount(0);
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await expect(component.getByText("Søk opp barnet med fødselsnummer eller D-nummer først")).toBeVisible();

        await søkefelt.press("Enter");
        await expect(component.getByText("Finnes ingen person eller samhandler med oppgitt ident")).toBeVisible();
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await expect(component.getByRole("dialog", { name: "Legg til nytt barn i saken" })).toBeVisible();
    });

    test("viser info om nyeste fødselsnummer i forhåndsvisningen når personen har fått nytt fødselsnummer", async ({
        mount,
        page,
    }) => {
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

    test("viser ikke info om nytt fødselsnummer når ident er uendret", async ({ mount, page }) => {
        const barnIdent = genererFnr();
        await mockPersonInformasjonFørMount(page, {
            [barnIdent]: { ident: barnIdent, visningsnavn: "Lite Barn", fødselsdato: "2015-01-01" },
        });

        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await component.getByRole("searchbox", { name: "Søk etter barn" }).fill(barnIdent);
        await component.getByRole("searchbox", { name: "Søk etter barn" }).press("Enter");

        await expect(component.getByText("Lite Barn")).toBeVisible();
        await expect(component.getByText("Bruker nyeste fødselsnummer")).toHaveCount(0);
    });

    test("viser feilmelding når ingen person finnes for oppgitt ident", async ({ mount, page }) => {
        await mockPersonInformasjonFørMount(page, {});

        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await component.getByRole("searchbox", { name: "Søk etter barn" }).fill(genererFnr());
        await component.getByRole("searchbox", { name: "Søk etter barn" }).press("Enter");

        await expect(component.getByText("Finnes ingen person eller samhandler med oppgitt ident")).toBeVisible();
    });

    test("søkefelt og knapper vises i small-størrelse", async ({ mount }) => {
        const component = await mount(STORY);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();

        await expect(component.getByRole("searchbox", { name: "Søk etter barn" })).toHaveClass(/small/);
        await expect(component.getByRole("button", { name: "Søk", exact: true })).toHaveClass(/small/);
        await expect(component.getByRole("button", { name: "Legg til", exact: true })).toHaveClass(/small/);
        await expect(component.getByRole("button", { name: "Avbryt" })).toHaveClass(/small/);
    });
});
