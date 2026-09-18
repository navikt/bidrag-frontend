import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser endringsloggen", async ({ page }) => {
    await assertPageIsUsable(page, routes.adminEndringslogg, page.getByRole("table"));
});
