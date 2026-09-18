import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser dokumentredigering", async ({ page }) => {
    await assertPageIsUsable(page, routes.redigerDokument, page.getByRole("button", { name: "Lagre og lukk" }));
});
