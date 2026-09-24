import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser saksreskontro", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakReskontro, page.getByRole("heading", { name: /^Saksreskontro for/ }));
});
