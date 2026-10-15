import { expect, test } from "@playwright/test";
import { FnrObfuscator } from "~/common/person/FnrObfuscator.ts";

const PERSONSCENARIO = "common/header/AppHeader/PersonsøkMedBrukerindeksAv";
const SAKSCENARIO = "common/header/AppHeader/SakssøkMedSaksindeksPå";

test.use({ reuseContext: false });

test.describe("App-headeren", () => {
    test.beforeEach(async ({ page }) => {
        await page.route("**/proxy/bidrag-admin/endringslogg**", (route) => route.fulfill({ json: [] }));
    });
    test("åpner person i Bisys uten gammel returkontekst når brukerindeksflagget er av", async ({ mount, page }) => {
        await page.route("https://bisys.example/**", async (route) => {
            await route.fulfill({ status: 200, contentType: "text/html", body: "Bisys-test" });
        });

        const header = await mount(PERSONSCENARIO);
        await expect(header.getByRole("link", { name: "Tilbake til Behandling" })).toBeVisible();
        const ident = await header.getByTestId("testident").inputValue();

        await header.getByRole("searchbox", { name: "Søk" }).fill(ident);
        await header.getByRole("searchbox", { name: "Søk" }).press("Enter");
        await page.waitForURL(
            (url) => url.origin === "https://bisys.example" && url.pathname === "/context/Brukeroversikt.do",
        );

        const url = new URL(page.url());
        expect(new FnrObfuscator().decode(url.searchParams.get("ident") ?? "")).toBe(ident);
        expect(url.searchParams.has("from")).toBe(false);
        expect(url.searchParams.has("returSaksnr")).toBe(false);
        expect(url.searchParams.get("sessionState")).toBe("test-session");
        expect(url.searchParams.has("enhet")).toBe(false);
    });

    test("åpner saksindeksen med Bisys-sesjon og uten gammel returkontekst når saksindeksflagget er på", async ({
        mount,
    }) => {
        const header = await mount(SAKSCENARIO);
        await expect(header.getByRole("link", { name: "Tilbake til Behandling" })).toBeVisible();

        const søk = header.getByRole("searchbox", { name: "Søk" });
        await søk.fill("2024123");
        await søk.press("Enter");

        await expect(header.getByTestId("gjeldende-adresse")).toHaveText(
            "/sak/2024123?sessionState=test-session&enhet=4806",
        );
        await expect(header.getByRole("link", { name: "Tilbake til Behandling" })).toHaveCount(0);
    });

    test("viser headerinnhold og innlogget bruker med utlogging", async ({ mount, page }) => {
        const header = await mount(PERSONSCENARIO);
        await expect(header.getByRole("link", { name: "Bidrag", exact: true })).toHaveAttribute("href", "/");
        await expect(header.getByRole("searchbox", { name: "Søk" })).toBeVisible();
        await expect(header.getByRole("link", { name: "Tilbake til Behandling" })).toBeVisible();
        await expect(header.getByRole("button", { name: "Systemer og oppslagsverk" })).toBeVisible();
        await expect(header.getByRole("button", { name: "Nyheter og endringer" })).toBeVisible();
        const brukermeny = header.getByRole("button", { name: /Test Saksbehandler/ });
        await expect(brukermeny).toBeVisible();
        await expect(brukermeny).toContainText("Z123456");
        await brukermeny.click();
        await expect(page.getByRole("menuitem", { name: "Logg ut" })).toHaveAttribute("href", "/oauth2/logout");
    });
});
