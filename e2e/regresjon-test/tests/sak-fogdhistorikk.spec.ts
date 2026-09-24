import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser fogdhistorikk", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakFogdhistorikk, page.getByRole("heading", { name: "Fogdhistorikk" }));
});
