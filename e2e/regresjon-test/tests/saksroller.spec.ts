import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser saksroller", async ({ page }) => {
    await assertPageIsUsable(page, routes.saksroller, page.getByRole("heading", { name: /^Rollebilde for sak/ }));
});
