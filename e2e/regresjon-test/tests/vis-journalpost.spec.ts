import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser journalpost", async ({ page }) => {
    await assertPageIsUsable(page, routes.visJournalpost, page.getByText(/Journalpost/).first());
});
