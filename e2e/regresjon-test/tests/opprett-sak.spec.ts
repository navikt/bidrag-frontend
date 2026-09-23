import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser siden for å opprette sak", async ({ page }) => {
    await assertPageIsUsable(page, routes.opprettSak, page.getByRole("heading", { name: "Opprett ny sak" }));
});
