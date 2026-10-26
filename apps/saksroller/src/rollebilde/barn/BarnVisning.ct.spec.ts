import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";

const STORY_UTEN_RM = "rollebilde/barn/BarnVisning/UtenReellMottaker";
const STORY_NYTT_BARN = "rollebilde/barn/BarnVisning/NyttBarnKanFjernes";
const STORY_PÅKREVD_RM = "rollebilde/barn/BarnVisning/PåkrevdReellMottaker";

test.describe("BarnVisning", () => {
    test("fjerner kun det nye barnet via Fjern barn-knappen, uten å påvirke andre barn", async ({ mount }) => {
        const component = await mount(STORY_NYTT_BARN);

        await expect(component.getByText("Nytt Barn", { exact: true })).toBeVisible();
        await expect(component.getByText("Eksisterende Barn")).toBeVisible();
        await expect(component.getByText("Ny", { exact: true })).toBeVisible();

        await component.getByRole("button", { name: "Fjern barn" }).click();

        await expect(component.getByText("Nytt Barn", { exact: true })).toHaveCount(0);
        await expect(component.getByText("Eksisterende Barn")).toBeVisible();
    });

    test("reell mottaker er påkrevd og 'Bidragsmottaker' er deaktivert når den ikke kan fjernes", async ({ mount }) => {
        const component = await mount(STORY_PÅKREVD_RM);

        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();

        const mottakerValg = component.getByRole("combobox", { name: "Hvem er reell mottaker?" });
        await expect(mottakerValg.getByRole("option", { name: "Bidragsmottaker" })).toBeDisabled();
    });

    test("viser samhandler etter et mislykket søk etterfulgt av et vellykket søk", async ({ mount, page }) => {
        const ukjentIdent = genererFnr();
        const samhandlerIdent = genererFnr();
        await page.route("**/proxy/bidrag-person/informasjon/", async (route) => {
            const { ident } = route.request().postDataJSON() as { ident: string };
            if (ident === ukjentIdent) {
                await route.fulfill({ status: 404, json: { message: "Fant ikke person" } });
                return;
            }
            await route.fulfill({ json: { ident, visningsnavn: "Funnet Mottaker" } });
        });

        const component = await mount(STORY_UTEN_RM);
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("combobox", { name: "Hvem er reell mottaker?" }).selectOption("samhandler");
        const søkefelt = component.getByRole("searchbox", { name: "Person- eller samhandlerident" });
        await søkefelt.fill(ukjentIdent);
        await søkefelt.press("Enter");
        await expect(component.getByText("Finnes ingen person eller samhandler med oppgitt ident")).toBeVisible();

        await søkefelt.fill(samhandlerIdent);
        await søkefelt.press("Enter");
        await expect(
            component.getByRole("dialog", { name: "Endre reell mottaker" }).getByText("Funnet Mottaker"),
        ).toBeVisible();
    });

    test("husker valgt mottaker når nedtrekkslisten byttes til barnet selv og tilbake", async ({ mount, page }) => {
        const mottakerIdent = genererFnr();
        await page.route("**/proxy/bidrag-person/informasjon/", (route) =>
            route.fulfill({ json: { ident: mottakerIdent, visningsnavn: "Funnet Mottaker" } }),
        );
        const component = await mount(STORY_UTEN_RM);
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        const dialog = component.getByRole("dialog", { name: "Endre reell mottaker" });
        const mottakerValg = dialog.getByRole("combobox", { name: "Hvem er reell mottaker?" });
        await expect(mottakerValg).toHaveValue("ingen");
        await mottakerValg.selectOption("samhandler");
        const søk = dialog.getByRole("searchbox", { name: "Person- eller samhandlerident" });
        await søk.fill(mottakerIdent);
        await søk.press("Enter");
        await expect(dialog.getByText("Funnet Mottaker")).toBeVisible();

        await mottakerValg.selectOption("barnet_selv");
        await expect(dialog.getByText("Funnet Mottaker")).toHaveCount(0);
        await mottakerValg.selectOption("samhandler");
        await expect(dialog.getByText("Funnet Mottaker")).toBeVisible();
    });
});
