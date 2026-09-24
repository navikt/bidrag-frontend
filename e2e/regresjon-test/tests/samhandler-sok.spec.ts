import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser samhandlersøk", async ({ page }) => {
    await assertPageIsUsable(page, routes.samhandlerSok, page.getByRole("heading", { name: "Søk samhandler" }));
});
