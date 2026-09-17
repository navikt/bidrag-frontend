import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser dokumentasjonssiden", async ({ page }) => {
    await assertPageIsUsable(page, routes.adminDokumentasjon, page.getByText("DOKUMENTASJON"));
});
