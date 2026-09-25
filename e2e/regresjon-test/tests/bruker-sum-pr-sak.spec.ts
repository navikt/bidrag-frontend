import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser sum per sak for bruker", async ({ page }) => {
    await assertPageIsUsable(page, routes.brukerSumPrSak, page.getByRole("heading", { name: /^Sum pr sak for/ }));
});
