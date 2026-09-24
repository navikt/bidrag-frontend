import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser siden for å opprette notat", async ({ page }) => {
    await assertPageIsUsable(page, routes.sakOpprettNotat, page.getByRole("heading", { name: "Opprett notat" }));
});
