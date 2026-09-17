import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser dokumentmaskering", async ({ page }) => {
    await assertPageIsUsable(page, routes.maskerDokument, page.getByRole("button", { name: /Ferdigstill/ }).first());
});
