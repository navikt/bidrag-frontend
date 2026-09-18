import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser samhandlerdetaljer", async ({ page }) => {
    await assertPageIsUsable(page, routes.samhandlerDetaljer, page.getByRole("heading", { name: "Samhandler" }));
});
