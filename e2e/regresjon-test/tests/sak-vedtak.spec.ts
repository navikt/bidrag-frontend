import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser vedtak i sak", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakVedtak, page.getByText(/Søknad om|Forholdsmessig fordeling/).first());
});
