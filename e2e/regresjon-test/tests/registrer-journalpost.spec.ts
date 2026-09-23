import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser journalføring", async ({ page }) => {
    await assertPageIsUsable(page, routes.registrerJournalpost, page.getByText("Registrer journalpost").first());
});
