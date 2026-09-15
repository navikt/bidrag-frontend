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

        await expect(component.getByText("3 journalposter")).toBeVisible();
        await expect(component.getByText("Vedtak om barnebidrag")).toBeVisible();
        await expect(component.getByText("Svar fra part")).toBeVisible();
        await expect(component.getByText("10.05.2024")).toBeVisible();
        await expect(component.getByText("BID", { exact: true })).toBeVisible();
        await expect(component.getByText("FAR", { exact: true })).toBeVisible();
        await expect(component.getByText("Ferdigstilt")).toBeVisible();
        await expect(component.getByText("Under produksjon")).toBeVisible();

        await component.getByText("Svar fra part").click();
        await expect(component.getByText("Vedlegg til svar")).toBeVisible();
    });

    test("skjuler feilregistrerte journalposter som standard og viser dem med filter", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_BLANDET);

        await expect(component.getByText("3 journalposter")).toBeVisible();
        await expect(component.getByText("Feilregistrert journalpost")).toHaveCount(0);

        await component.getByRole("button", { name: "Filter" }).click();
        await component.getByRole("checkbox", { name: "Vis feilregistrerte" }).check();

        await expect(component.getByText("Feilregistrert journalpost")).toBeVisible();
        await expect(component.getByText("3 journalposter")).toBeVisible();
    });

    test("viser kun farskapsutelukkede journalposter når filteret aktiveres", async ({ mount, page }) => {
        await mockSak(page);
        const component = await mount(STORY_FARSKAP);

        await component.getByRole("button", { name: "Filter" }).click();
        await component.getByRole("checkbox", { name: "Vis kun farskapsutelukket" }).check();

        await expect(component.getByText("Farskapsdokument")).toBeVisible();
        await expect(component.getByText("1 journalposter")).toBeVisible();
        await expect(component.getByText("Vedtak om barnebidrag")).toHaveCount(0);
    });
});
