import { expect, test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("lenken fra Bisys åpner ny saksrolleflyt uten forhåndsutfylt person", async ({ page }) => {
    await assertPageIsUsable(page, routes.nySaksroller, page.getByRole("heading", { name: "Opprett ny sak" }));

    await expect(page).toHaveURL(/\/sak\/ny\?/);
    expect(new URL(page.url()).searchParams.get("from")).toBe("bisys");
    await expect(page.getByRole("searchbox", { name: "Søk etter person" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
});
