import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/ForelderUtenBarn/ForelderUtenBarn/Standard";

test("søker opp barn og foreslår registrert forelder", async ({ mount, page }) => {
    await mockWizardApi(page, {
        parentRelations: {
            [testpersoner.barnUnder18.ident]: [testpersoner.bidragsmottaker.ident],
        },
    });
    const component = await mount(STORY);

    await component.getByRole("button", { name: "Legg til barn manuelt" }).click();
    await page.getByRole("searchbox", { name: "Oppgi barn i saken manuelt" }).fill(testpersoner.barnUnder18.ident);
    await page.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");

    await expect(component.getByText("Barn som legges til")).toBeVisible();
    await expect(component.getByText(/Foreslått bidragsmottaker/)).toBeVisible();
    await expect(
        component.getByRole("button", { name: `Bruk ${testpersoner.bidragsmottaker.visningsnavn}` }),
    ).toBeVisible();
    await expectNoAxeViolations(page, component);
});
