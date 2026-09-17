import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser journalpost i sak", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakVisJournalpost, page.getByText(/Journalpost/).first());
});
