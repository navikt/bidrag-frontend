import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser forsendelse", async ({ page }) => {
    await assertPageIsUsable(page, routes.forsendelse, page.getByText("Dokumenter").first());
});
