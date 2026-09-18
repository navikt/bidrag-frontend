import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const BASE_STORY = "routes/sak/sakshistorikk/components/journalpost/JournalpostTabell";
const STORY_TOM = `${BASE_STORY}/TomListe`;
const STORY_BLANDET = `${BASE_STORY}/BlandedeJournalposter`;
const STORY_FARSKAP = `${BASE_STORY}/MedFarskapsutelukkede`;

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
});
