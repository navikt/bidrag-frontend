import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import type { Page } from "@playwright/test";

const STORY_STANDARD = "routes/sak/saksroller/components/PersonSøkWrapper/Standard";
const STORY_MED_ACTIONS = "routes/sak/saksroller/components/PersonSøkWrapper/MedCustomActions";

async function mockPersonInformasjonFørMount(
    page: Page,
    svar: Record<string, { ident: string; visningsnavn: string }>,
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

test.describe("PersonSøkWrapper", () => {
    test("er ikke en modal, søker opp person og viser treffet", async ({ mount, page }) => {
        const ident = genererFnr();
        await mockPersonInformasjonFørMount(page, { [ident]: { ident, visningsnavn: "Kari Nordmann" } });

        const component = await mount(STORY_STANDARD);
        await expect(component.getByRole("dialog")).toHaveCount(0);

        await component.getByRole("searchbox", { name: "Søk etter person" }).fill(ident);
        await component.getByRole("searchbox", { name: "Søk etter person" }).press("Enter");

        await expect(component.getByText("Kari Nordmann")).toBeVisible();
    });

    test("viser feilmelding kun én gang når ingen person finnes", async ({ mount, page }) => {
        await mockPersonInformasjonFørMount(page, {});

        const component = await mount(STORY_STANDARD);
        await component.getByRole("searchbox", { name: "Søk etter person" }).fill(genererFnr());
        await component.getByRole("searchbox", { name: "Søk etter person" }).press("Enter");

        await expect(component.getByText("Finnes ingen person eller samhandler med oppgitt ident")).toHaveCount(1);
    });

    test("standard 'Avbryt'-knapp lukker søkevisningen", async ({ mount }) => {
        const component = await mount(STORY_STANDARD);

        await component.getByRole("button", { name: "Avbryt" }).click();

        await expect(component.getByRole("heading", { name: "Legg til person" })).toHaveCount(0);
        await expect(component.getByText("Søk avbrutt")).toBeVisible();
    });

    test("egendefinerte actions overstyrer standard Avbryt-knappen", async ({ mount, page }) => {
        const ident = genererFnr();
        await mockPersonInformasjonFørMount(page, { [ident]: { ident, visningsnavn: "Ola Nordmann" } });

        const component = await mount(STORY_MED_ACTIONS);
        const leggTilKnapp = component.getByRole("button", { name: "Legg til", exact: true });
        await expect(leggTilKnapp).toBeEnabled();
        await leggTilKnapp.click();
        await expect(component.getByRole("alert")).toContainText("Søk opp en person før du legger til.");

        await component.getByRole("searchbox", { name: "Søk etter person" }).fill(ident);
        await component.getByRole("searchbox", { name: "Søk etter person" }).press("Enter");

        await leggTilKnapp.click();

        await expect(component.getByText("Ola Nordmann er lagt til")).toBeVisible();
    });
});
