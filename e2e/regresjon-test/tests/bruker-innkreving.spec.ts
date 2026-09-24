import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser innkreving for bruker", async ({ page }) => {
    await assertPageIsUsable(
        page,
        routes.brukerInnkreving,
        page.getByRole("heading", { name: /^Innkreving for bruker/ }),
    );
});
