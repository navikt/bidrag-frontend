import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser journalføring i sak", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakRegistrerJournalpost, page.getByText("Registrer journalpost").first());
});
