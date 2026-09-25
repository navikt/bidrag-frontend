import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/Farskap/Farskap/Standard";

test("krever barn, bruker arbeidsfordeling FRS og oppretter farskapssak", async ({ mount, page }) => {
    const requests = await mockWizardApi(page);
    const component = await mount(STORY);

    const opprettKnapp = component.getByRole("button", { name: /Opprett$/ });
    await expect(opprettKnapp).toBeEnabled();
    await opprettKnapp.click();
    await expect(component.getByText("Du må velge minst ett barn.")).toBeVisible();

    await component.getByRole("checkbox").first().check();
    await expect.poll(() => requests.unit.some((request) => request.arbeidsfordeling === "FRS")).toBe(true);
    await expectNoAxeViolations(page, component);

    await opprettKnapp.click();
    await expect.poll(() => requests.create).toBeTruthy();
    expect(requests.create).toMatchObject({ arbeidsfordeling: "FRS" });
    expect((requests.create?.roller as { type: string }[]).map((r) => r.type)).toContain("BA");
});
