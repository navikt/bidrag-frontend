import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser vedtak explorer", async ({ page }) => {
    await assertPageIsUsable(page, routes.adminVedtakExplorer, page.getByRole("heading", { name: "Vedtak explorer" }));
});
