import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser begrunnelseseditor", async ({ page }) => {
    await assertPageIsUsable(page, routes.behandlingBegrunnelse, page.getByText("Begrunnelse").first());
});
