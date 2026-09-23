import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Farskap/Farskap/Standard";

test.describe("Farskap", () => {
    test("krever barn og bruker arbeidsfordeling FRS", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        const component = await mount(STORY);

        const opprettKnapp = component.getByRole("button", { name: /Opprett$/ });
        await expect(opprettKnapp).toBeEnabled();
        await opprettKnapp.click();
        await expect(component.getByText("Du må velge minst ett barn.")).toBeVisible();

        await component.getByRole("checkbox").first().check();
        await expect.poll(() => requests.unit.some((request) => request.arbeidsfordeling === "FRS")).toBe(true);
        await expectNoAxeViolations(page, component);
    });

    test("viser feil fra opprettelse", async ({ mount, page }) => {
        await mockWizardApi(page, { createStatus: 500, createBody: "Testfeil ved opprettelse" });
        const component = await mount(STORY);
        await component.getByRole("checkbox").first().check();
        await component.getByRole("button", { name: /Opprett$/ }).click();

        await expect(component.getByText("Kunne ikke opprette sak")).toBeVisible();
    });
});
