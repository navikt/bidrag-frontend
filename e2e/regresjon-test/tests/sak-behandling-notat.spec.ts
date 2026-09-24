import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser behandlingsnotat i sak", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakBehandlingNotat, page.getByRole("tab", { name: "Standard" }));
});
