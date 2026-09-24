import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser begrunnelseseditor i sak", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakBegrunnelse, page.getByText("Begrunnelse").first());
});
