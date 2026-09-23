import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { samhandler } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Oppfostringsbidrag/Oppfostringsbidrag/Standard";

test("krever samhandler som reell mottaker og bruker arbeidsfordeling OPS", async ({ mount, page }) => {
    const requests = await mockWizardApi(page);
    const component = await mount(STORY);

    await component.getByRole("checkbox").first().check();

    await expect(component.getByText(/Barnet selv kan ikke velges som reell mottaker/)).toBeVisible();
    await expect(component.getByRole("button", { name: "Legg til reell mottaker" })).toHaveCount(0);
    const opprettKnapp = component.getByRole("button", { name: /Opprett$/ });
    await expect(opprettKnapp).toBeEnabled();
    await opprettKnapp.click();
    await expect(component.getByText("Du må registrere reell mottaker")).toBeVisible();

    const search = component.getByRole("searchbox", { name: "Person- eller samhandlerident" });
    await search.fill(samhandler.samhandlerId);
    await search.press("Enter");
    await expect(component.getByText(samhandler.navn).first()).toBeVisible();
    await expect(component.getByText(samhandler.navn).first()).toBeVisible();

    await expect.poll(() => requests.unit.some((request) => request.arbeidsfordeling === "OPS")).toBe(true);
    await expectNoAxeViolations(page, component);
});
