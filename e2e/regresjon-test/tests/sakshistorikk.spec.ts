import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser sakshistorikk", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakshistorikk, page.getByRole("heading", { name: "Sakslogg" }));
});
