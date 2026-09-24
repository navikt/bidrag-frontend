import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser vedtaksnotat", async ({ page }) => {
    await assertPageIsUsable(page, routes.vedtakNotat, page.getByRole("tab", { name: "Standard" }));
});
