import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/sakshistorikk/components/hendelse/SaksLogg/ForskjelligeHendelser";

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
});
