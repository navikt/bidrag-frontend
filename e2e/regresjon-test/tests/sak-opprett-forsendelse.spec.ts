import { test } from "../fixtures/authenticatedTest.ts";
import { routes } from "../routes/routes.ts";
import { assertPageIsUsable } from "../support/assertPageIsUsable.ts";

test("viser siden for å opprette forsendelse", async ({ page }) => {
    await assertPageIsUsable(
        page,
        routes.sakOpprettForsendelse,
        page.getByRole("heading", { name: "Opprett forsendelse" }),
    );
});
