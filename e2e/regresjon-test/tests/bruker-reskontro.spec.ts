import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser reskontro for bruker", async ({ page }) => {
    await assertPageIsUsable(
        page,
        routes.brukerReskontro,
        page.getByRole("heading", { name: /^Reskontro for bruker/ }),
    );
});
