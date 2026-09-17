import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser ny saksrolleflyt", async ({ page }) => {
    await assertPageIsUsable(page, routes.nySaksroller, page.getByRole("heading", { name: "Opprett ny sak" }));
});
