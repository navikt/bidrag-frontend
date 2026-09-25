import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser behandlingsnotat", async ({ page }) => {
    await assertPageIsUsable(page, routes.behandlingNotat, page.getByRole("tab", { name: "Standard" }));
});
