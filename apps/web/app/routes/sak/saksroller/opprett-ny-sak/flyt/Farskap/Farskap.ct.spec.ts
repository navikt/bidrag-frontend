import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Farskap/Farskap/Standard";

test.describe("Farskap", () => {
    test("krever barn og bruker arbeidsfordeling FRS", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        const component = await mount(STORY);

        await expect(component.getByRole("button", { name: /Opprett$/ })).toBeDisabled();
        await component.getByRole("checkbox").first().check();
        await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();
        await expect.poll(() => requests.unit.some((request) => request.behandlingstema === "ab0322")).toBe(true);
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
