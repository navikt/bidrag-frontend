import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test.skip("viser skjemautfylling", async ({ page }) => {
    await assertPageIsUsable(page, routes.fyllUtSkjema, page.getByRole("button", { name: /Ferdigstill/ }).first());
});
