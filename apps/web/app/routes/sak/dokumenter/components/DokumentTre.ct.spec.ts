import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import type { Locator } from "@playwright/test";

const STORY = "routes/sak/dokumenter/components/DokumentTre/ListeMedVedlegg";

const journalpostHeader = (component: Locator, tittel: string) =>
    component.locator("button.aksel-accordion__header", { hasText: tittel });

test.describe("DokumentTre", () => {
    test("viser samme dato som Journalen for et dokument som er skannet senere", async ({ mount }) => {
        const component = await mount(STORY);
        const søknad = journalpostHeader(component, "Søknad om barnebidrag");

        await expect(søknad).toContainText("06.01.2025");
        await expect(søknad).not.toContainText("02.10.2026");

        await søknad.click();
        await expect(component.getByText("Dok. 06.01.2025")).toBeVisible();
        await expect(component.getByText("Dok. 02.10.2026")).toHaveCount(0);
    });

    test("et museklikk på en åpen journalpost holder den åpen og viser hoveddokumentet igjen", async ({ mount }) => {
        const component = await mount(STORY);
        const søknad = journalpostHeader(component, "Søknad om barnebidrag");
        const vedtak = journalpostHeader(component, "Vedtak barnebidrag");
        const valgt = component.getByTestId("valgt-dokument");

        await søknad.click();
        await expect(søknad).toHaveAttribute("aria-expanded", "true");
        await expect(valgt).toHaveText("Søknad om barnebidrag");

        await component.getByRole("button", { name: "Inntektsopplysninger" }).click();
        await expect(valgt).toHaveText("Inntektsopplysninger");

        await vedtak.click();
        await expect(valgt).toHaveText("Vedtak barnebidrag");

        await søknad.click();
        await expect(søknad).toHaveAttribute("aria-expanded", "true");
        await expect(valgt).toHaveText("Søknad om barnebidrag");
    });

    test("dobbeltklikk lukker journalposten, og Enter åpner og lukker den", async ({ mount }) => {
        const component = await mount(STORY);
        const søknad = journalpostHeader(component, "Søknad om barnebidrag");

        await søknad.click();
        await expect(søknad).toHaveAttribute("aria-expanded", "true");

        await søknad.dblclick();
        await expect(søknad).toHaveAttribute("aria-expanded", "false");

        await søknad.focus();
        await søknad.press("Enter");
        await expect(søknad).toHaveAttribute("aria-expanded", "true");
        await søknad.press("Enter");
        await expect(søknad).toHaveAttribute("aria-expanded", "false");
    });

    test("viser vedlegg med svart tekst", async ({ mount, page }) => {
        const component = await mount(STORY);
        await journalpostHeader(component, "Søknad om barnebidrag").click();

        const vedleggTekst = component
            .getByRole("button", { name: "Inntektsopplysninger" })
            .getByText("Inntektsopplysninger");
        const farge = await vedleggTekst.evaluate((el) => getComputedStyle(el).color);
        const svart = await page.evaluate(() => {
            const el = document.createElement("span");
            el.className = "text-gray-900";
            document.body.appendChild(el);
            const color = getComputedStyle(el).color;
            el.remove();
            return color;
        });

        expect(farge).toBe(svart);
    });
});
