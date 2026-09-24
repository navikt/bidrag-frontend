import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser brukerveiledningen for bidrag", async ({ page }) => {
    await assertPageIsUsable(page, routes.brukerveiledningBidrag, page.getByRole("heading").first());
});
