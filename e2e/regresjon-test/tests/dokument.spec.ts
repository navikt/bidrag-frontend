import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser dokument", async ({ page }) => {
    await assertPageIsUsable(page, routes.dokument, page.getByText(/Journalpost/).first());
});
