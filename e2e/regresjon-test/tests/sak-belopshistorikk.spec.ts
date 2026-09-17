import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser beløpshistorikk", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakBelopshistorikk, page.getByRole("tab", { name: "Bidrag/Forskudd" }));
});
