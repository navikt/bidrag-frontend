import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import type { Page } from "@playwright/test";

const BASE_STORY = "routes/sak/sakshistorikk/components/journalpost/JournalpostTabell";
const STORY_TOM = `${BASE_STORY}/TomListe`;
const STORY_BLANDET = `${BASE_STORY}/BlandedeJournalposter`;
const STORY_FARSKAP = `${BASE_STORY}/MedFarskapsutelukkede`;
const STORY_LANG_BESKRIVELSE = `${BASE_STORY}/LangBeskrivelse`;
const STORY_SENT_SKANNET = `${BASE_STORY}/SentSkannetDokument`;

// Gir en tabell på ca. 1200 px, som på sakshistorikksiden i et vindu på 1536 px.
const BREDT_VINDU = 1265;

async function mockSak(page: Page) {
    await page.route(/\/proxy\/bidrag-sak\/sak\/2024(?:%2F|\/)1234(?:\?.*)?$/i, async (route) => {
        await route.fulfill({ json: { roller: [] } });
    });
}

test.describe("JournalpostTabell", () => {
    test("viser tom tilstand med null journalposter", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_TOM);

        await expect(component.getByRole("heading", { name: "Journal" })).toBeVisible();
        await expect(component.getByText("0 journalposter")).toBeVisible();
        await expect(component.getByRole("columnheader", { name: "Beskrivelse" })).toBeVisible();
        await expect(component.getByRole("row")).toHaveCount(1);
    });

    test("viser datoer, fagområder, statuser og vedlegg for blandede journalposter", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);

        await expect(component.getByText("4 av 5 journalposter")).toBeVisible();
        await expect(component.getByText("Enkelt dokument", { exact: true })).toBeVisible();
        await expect(component.getByText("Ferdigstilt samlelenke")).toBeVisible();
        await expect(component.getByText("10.05.2024")).toBeVisible();
        await expect(component.getByText("BID", { exact: true })).toHaveCount(2);
        await expect(component.getByText("FAR", { exact: true })).toHaveCount(1);
        await expect(component.getByText("Ferdigstilt", { exact: true })).toHaveCount(2);
        await expect(component.getByText("Under produksjon", { exact: true })).toHaveCount(2);

        await component
            .getByRole("row")
            .filter({ hasText: "Ferdigstilt samlelenke" })
            .getByRole("button", { name: "Vis under-rader" })
            .click();
        await expect(component.getByText("Ferdigstilt vedlegg")).toBeVisible();
    });

    test("skjuler feilregistrerte journalposter som standard og viser dem med filter", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);

        await expect(component.getByText("4 av 5 journalposter")).toBeVisible();
        await expect(component.getByText("Feilregistrert journalpost")).toHaveCount(0);

        await component.getByRole("button", { name: "Filter" }).click();
        await component.getByRole("checkbox", { name: "Vis feilregistrerte" }).check();

        await expect(component.getByText("Feilregistrert journalpost")).toBeVisible();
        await expect(component.getByText("5 journalposter")).toBeVisible();
    });

    test("viser kun farskapsutelukkede journalposter når filteret aktiveres", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_FARSKAP);

        await component.getByRole("button", { name: "Filter" }).click();
        await component.getByRole("checkbox", { name: "Vis kun farskapsutelukket" }).check();

        await expect(component.getByText("Farskapsdokument")).toBeVisible();
        await expect(component.getByText("1 journalposter")).toBeVisible();
        await expect(component.getByText("Enkelt dokument")).toHaveCount(0);
    });

    test("viser dokumentlenke når journalposten kun har ett dokument", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);

        await expect(component.getByRole("link", { name: "Enkelt dokument", exact: true })).toBeVisible();
    });

    test("viser dokumentlenke når det eneste dokumentet er under produksjon", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);

        await expect(component.getByRole("link", { name: "Enkelt dokument under produksjon" })).toBeVisible();
    });

    test("viser samlelenke og dokumentlenker når dokumenter er ferdigstilt", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);

        await expect(component.getByRole("link", { name: "(2) Ferdigstilt samlelenke" })).toBeVisible();
        await component
            .getByRole("row")
            .filter({ hasText: "Ferdigstilt samlelenke" })
            .getByRole("button", { name: "Vis under-rader" })
            .click();

        await expect(component.getByRole("link", { name: "Ferdigstilt hoveddokument" })).toBeVisible();
        await expect(component.getByRole("link", { name: "Ferdigstilt vedlegg" })).toBeVisible();
    });

    test("viser ikke samlelenke når et dokument er under produksjon, men viser dokumentlenker", async ({
        mount,
        page,
    }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);

        await expect(component.getByRole("link", { name: "(2) Samling med dokument under produksjon" })).toHaveCount(0);
        await expect(component.getByText("(2) Samling med dokument under produksjon")).toBeVisible();
        await component
            .getByRole("row")
            .filter({ hasText: "Samling med dokument under produksjon" })
            .getByRole("button", { name: "Vis under-rader" })
            .click();

        await expect(component.getByRole("link", { name: "Dokument under redigering" })).toBeVisible();
        await expect(component.getByRole("link", { name: "Ferdigstilt vedlegg under produksjon" })).toBeVisible();
    });

    test("viser alle kolonner uten sideveis rulling i et bredt vindu når beskrivelsen er lang", async ({
        mount,
        page,
    }) => {
        await mockSak(page);
        await page.setViewportSize({ width: BREDT_VINDU, height: 800 });
        const component = await mount(STORY_LANG_BESKRIVELSE);

        const tabell = component.locator(".aksel-data-table__scroll-wrapper");
        await expect(component.getByRole("columnheader", { name: "Status" })).toBeVisible();
        await expect(component.getByRole("columnheader", { name: "Gjelder" })).toBeVisible();
        expect(await tabell.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    });

    test("gir vedleggene samme bakgrunn som journalposten, og stripene følger journalpostene", async ({
        mount,
        page,
    }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);
        const bakgrunn = (tekst: string) =>
            component
                .getByRole("row")
                .filter({ hasText: tekst })
                .first()
                .evaluate((el) => getComputedStyle(el).backgroundColor);

        await component
            .getByRole("row")
            .filter({ hasText: "Ferdigstilt samlelenke" })
            .getByRole("button", { name: "Vis under-rader" })
            .click();

        const samlelenke = await bakgrunn("Ferdigstilt samlelenke");
        expect(await bakgrunn("Ferdigstilt hoveddokument")).toBe(samlelenke);
        expect(await bakgrunn("Ferdigstilt vedlegg")).toBe(samlelenke);
        expect(await bakgrunn("Samling med dokument under produksjon")).not.toBe(samlelenke);
        expect(await bakgrunn("Enkelt dokument")).not.toBe(samlelenke);
    });

    test("sorterer journalposter fra Joark etter Dok.dato, også når dokumentet ble skannet senere", async ({
        mount,
        page,
    }) => {
        await mockSak(page);
        await page.setViewportSize({ width: BREDT_VINDU, height: 800 });
        const component = await mount(STORY_SENT_SKANNET);
        await expect(component.getByText("Referat samtale")).toBeVisible();

        const dokDatoer = await component
            .locator("tbody tr")
            .evaluateAll((rader) => rader.map((rad) => rad.querySelectorAll("td")[3]?.textContent?.trim()));
        expect(dokDatoer).toEqual(["04.03.2025", "28.02.2025", "12.02.2025", "04.02.2025"]);
    });

    test("viser pilen for vedlegg midt i en smal første kolonne", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);
        const pil = component.getByRole("button", { name: "Vis under-rader" }).first();

        const { kolonne, venstre, hoyre } = await pil.evaluate((knapp) => {
            const celle = (knapp.closest("td") as HTMLElement).getBoundingClientRect();
            const k = knapp.getBoundingClientRect();
            return { kolonne: celle.width, venstre: k.left - celle.left, hoyre: celle.right - k.right };
        });
        expect(kolonne).toBeLessThanOrEqual(36);
        expect(Math.abs(venstre - hoyre)).toBeLessThanOrEqual(1);
    });

    test("viser rader med internt notat (X) med grå tekst, og rader med I og U med vanlig tekst", async ({
        mount,
        page,
    }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);
        const farge = (dokDato: string) =>
            component
                .getByRole("cell", { name: dokDato, exact: true })
                .first()
                .evaluate((el) => getComputedStyle(el).color);

        const x = await farge("14.05.2024");
        expect(x).not.toBe(await farge("12.05.2024"));
        expect(await farge("12.05.2024")).toBe(await farge("10.05.2024"));
    });

    test("viser ikonet i full størrelse når beskrivelsen er kuttet", async ({ mount, page }) => {
        await mockSak(page);
        await page.setViewportSize({ width: BREDT_VINDU, height: 800 });
        const component = await mount(STORY_LANG_BESKRIVELSE);

        const ikon = component.getByRole("row").filter({ hasText: "(lenke)" }).getByRole("img", { name: "Åpne" });
        const bredde = await ikon.evaluate((el) => el.getBoundingClientRect().width);
        expect(bredde).toBeGreaterThanOrEqual(14);
    });

    test("viser hele beskrivelsen i en tooltip når teksten er kuttet", async ({ mount, page }) => {
        await mockSak(page);
        await page.setViewportSize({ width: BREDT_VINDU, height: 800 });
        const component = await mount(STORY_LANG_BESKRIVELSE);

        await component
            .getByText(/^Orientering og varsel om barnebidrag/)
            .first()
            .hover();
        await expect(page.getByRole("tooltip")).toHaveText(
            "Orientering og varsel om barnebidrag for revurdering etter endring i inntekt for begge parter i hele perioden",
        );
    });
});
