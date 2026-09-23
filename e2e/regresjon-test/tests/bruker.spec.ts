import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser brukeroversikten", async ({ page }) => {
    await assertPageIsUsable(page, routes.bruker, page.getByRole("heading", { name: /^Brukeroversikt for/ }));
});
