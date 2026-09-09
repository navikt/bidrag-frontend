import { expect, test } from "@playwright/test";
import { samhandler } from "../fixtures";
import { expectNoAxeViolations, mockWizardApi } from "../network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/playwright/oppfostringsbidrag/Oppfostringsbidrag/Standard";

test("krever samhandler som reell mottaker og bruker arbeidsfordeling OPS", async ({ mount, page }) => {
    const requests = await mockWizardApi(page);
    const component = await mount(STORY);

    await component.getByRole("checkbox").first().check();

    await expect(component.getByText(/Barnet selv kan ikke velges som reell mottaker/)).toBeVisible();
    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeDisabled();

    const search = component.getByRole("searchbox", { name: "Person- eller samhandlerident" });
    await search.fill(samhandler.samhandlerId);
    await search.press("Enter");

    await expect(component.getByText(samhandler.navn).first()).toBeVisible();
    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();
    await expect.poll(() => requests.unit.some((request) => request.behandlingstema === "ab0324")).toBe(true);
    await expectNoAxeViolations(page, component);
});
