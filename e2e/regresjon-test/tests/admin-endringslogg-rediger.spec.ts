import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser siden for redigering av endringslogg", async ({ page }) => {
    await assertPageIsUsable(
        page,
        routes.adminEndringsloggRediger,
        page.getByRole("textbox", { name: "Tittel" }).first(),
    );
});
