import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser brukerveiledningen for særbidrag", async ({ page }) => {
    await assertPageIsUsable(page, routes.brukerveiledningSaerbidrag, page.getByRole("heading").first());
});
