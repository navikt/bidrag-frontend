import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import type { Page } from "@playwright/test";

const STORY = "routes/sak/sakshistorikk/components/hendelse/SaksLogg/ForskjelligeHendelser";
const STORY_LANGT_RESULTAT = "routes/sak/sakshistorikk/components/hendelse/SaksLogg/LangtResultat";

// Gir en tabell på ca. 1200 px, som på sakshistorikksiden i et vindu på 1536 px.
const BREDT_VINDU = 1265;

async function mockSkrivetilgang(page: Page) {
    await page.route("**/proxy/bidrag-sak/sak/**/kanSkrive**", async (route) => {
        await route.fulfill({ json: true });
    });
}

test.describe("SaksLogg", () => {
    test("viser ulike hendelsestyper med dato, enhet og resultat", async ({ mount, page }) => {
        await mockSkrivetilgang(page);
        const component = await mount(STORY);

        await expect(component.getByRole("heading", { name: "Sakslogg" })).toBeVisible();
        await expect(component.getByRole("columnheader", { name: "Dato" })).toBeVisible();
        await expect(component.getByRole("columnheader", { name: "Hendelse" })).toBeVisible();
        await expect(component.getByText("Søknad fra bidragsmottaker")).toBeVisible();
        await expect(component.getByText("Vedtak", { exact: true })).toBeVisible();
        await expect(component.getByText("Indeksregulering")).toBeVisible();
        await expect(component.getByText("Klagevedtak", { exact: true })).toBeVisible();
        await expect(component.getByText("Fastsettelse")).toBeVisible();
        await expect(component.getByText("Indeksregulert")).toBeVisible();
        await expect(component.getByText("4803", { exact: true })).toHaveCount(6);
    });

    test("viser skrivehandlinger for søknad og klage, samt resultatlenke for vedtak", async ({ mount, page }) => {
        await mockSkrivetilgang(page);
        const component = await mount(STORY);

        await expect(
            component
                .getByRole("row")
                .filter({ hasText: "Søknad fra bidragsmottaker" })
                .getByRole("link", { name: "Søknad" }),
        ).toBeVisible();
        await expect(
            component.getByRole("row").filter({ hasText: "Klagevedtak" }).getByRole("link", { name: "Lag klage" }),
        ).toBeVisible();
        await expect(
            component.getByRole("row").filter({ hasText: "Vedtak" }).getByRole("link", { name: "Fastsettelse" }),
        ).toHaveAttribute("href", /\/sak\/2024\/1234\/vedtak\/vedtak-2/);
        await expect(
            component
                .getByRole("row")
                .filter({ hasText: "Indeksregulering" })
                .getByRole("link", { name: "Indeksregulert" }),
        ).toHaveAttribute("href", /\/sak\/2024\/1234\/vedtak\/vedtak-3/);
    });

    test("viser lenkene for forsendelse og notat i én kolonne med overskriften Opprett", async ({ mount, page }) => {
        await mockSkrivetilgang(page);
        const component = await mount(STORY);

        const overskrifter = component.getByRole("columnheader");
        await expect(overskrifter.nth(0)).toHaveText("Behandle");
        await expect(overskrifter.nth(1)).toHaveText("Opprett");
        await expect(overskrifter.nth(2)).toHaveText("Dato");

        const opprettCelle = component
            .getByRole("row")
            .filter({ hasText: "Søknad fra bidragsmottaker" })
            .getByRole("cell")
            .nth(1);
        await expect(opprettCelle.getByRole("link", { name: "Opprett forsendelse" })).toBeVisible();
        await expect(opprettCelle.getByRole("link", { name: "Opprett notat" })).toBeVisible();
    });

    test("viser paginering når saksloggen har mer enn seks hendelser", async ({ mount, page }) => {
        await mockSkrivetilgang(page);
        const component = await mount(STORY);

        await expect(component.getByRole("row")).toHaveCount(7);
        const pagination = component.getByRole("navigation");
        await expect(pagination).toBeVisible();
        await expect(pagination.getByRole("button", { name: "1" })).toBeVisible();
        await expect(pagination.getByRole("button", { name: "2" })).toBeVisible();
        await expect(component.getByText("Endring fra bidragsmottaker")).toHaveCount(0);

        await pagination.getByRole("button", { name: "2" }).click();

        await expect(component.getByText("Endring fra bidragsmottaker")).toBeVisible();
        await expect(component.getByText("Sak avsluttet")).toHaveCount(0);
    });

    test("skjuler feilregistrerte hendelser og hendelser med samme søknadsid som standard, og viser dem med avkrysningsboks", async ({
        mount,
        page,
    }) => {
        await mockSkrivetilgang(page);
        const component = await mount(STORY);

        await expect(component.getByText("Feilregistrert søknad")).toHaveCount(0);
        await expect(component.getByText("Søknad fra bidragspliktig")).toHaveCount(0);
        await expect(component.getByText("Søknad fra bidragsmottaker")).toBeVisible();

        await component.getByRole("checkbox", { name: "Vis feilregistrerte" }).check();

        await expect(component.getByText("Feilregistrert søknad")).toBeVisible();
        await expect(component.getByText("Søknad fra bidragspliktig")).toBeVisible();

        await component.getByRole("checkbox", { name: "Vis feilregistrerte" }).uncheck();
        await expect(component.getByText("Feilregistrert søknad")).toHaveCount(0);
    });

    test("viser alle kolonner uten sideveis rulling i et bredt vindu når resultatet er langt", async ({
        mount,
        page,
    }) => {
        await mockSkrivetilgang(page);
        await page.setViewportSize({ width: BREDT_VINDU, height: 800 });
        const component = await mount(STORY_LANGT_RESULTAT);

        const tabell = component.locator(".aksel-data-table__scroll-wrapper");
        await expect(component.getByRole("columnheader", { name: "Resultat" })).toBeVisible();
        expect(await tabell.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    });

    test("viser hele resultatet i en tooltip når teksten er kuttet", async ({ mount, page }) => {
        await mockSkrivetilgang(page);
        await page.setViewportSize({ width: BREDT_VINDU, height: 800 });
        const component = await mount(STORY_LANGT_RESULTAT);

        await component
            .getByText(/^Bidraget ble ikke aldersjustert/)
            .first()
            .hover();
        await expect(page.getByRole("tooltip")).toHaveText(
            "Bidraget ble ikke aldersjustert fordi grunnlaget i vedtaket er justert ned til evne, og det gjelder hele perioden",
        );
    });
});
