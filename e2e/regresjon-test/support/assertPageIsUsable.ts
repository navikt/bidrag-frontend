import { expect, type Locator, type Page } from "@playwright/test";

export async function assertPageIsUsable(page: Page, path: string, pageMarker: Locator) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    const pageFailure = page.getByRole("heading", {
        name: /En teknisk feil har oppstått|Advarsel: Du har ikke tilgang/,
    });

    expect(response, "Navigasjonen ga ikke et hoveddokument-svar.").not.toBeNull();
    expect(response?.status(), "Hoveddokumentet svarte med feilstatus.").toBeLessThan(400);
    await expect(pageMarker.or(pageFailure).first()).toBeVisible();
    expect(await pageFailure.count(), "Siden viste en teknisk feil eller et tilgangsavslag.").toBe(0);
    await expect(pageMarker).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(new URL(path, "http://playwright.local").pathname);
}
