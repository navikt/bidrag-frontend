import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser forsendelse i sak", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakForsendelse, page.getByText("Dokumenter").first());
});
