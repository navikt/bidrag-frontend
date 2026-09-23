import { testpersoner } from "@ct/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/ForelderUtenBarn/ForelderUtenBarn/Standard";

test("søker opp barn og velger entydig registrert forelder automatisk", async ({ mount, page }) => {
    await mockWizardApi(page, {
        parentRelations: {
            [testpersoner.barnUnder18.ident]: [testpersoner.bidragsmottaker.ident],
        },
    });
    const component = await mount(STORY);

    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søkEtterBarn = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søkEtterBarn.fill(testpersoner.barnUnder18.ident);
    await søkEtterBarn.press("Enter");
    await expect(component.getByText(testpersoner.barnUnder18.visningsnavn).first()).toBeVisible();
    await component.getByRole("button", { name: "Legg til", exact: true }).click();

    await expect(component.getByText("Barn som legges til")).toBeVisible();
    await expect(component.getByText(testpersoner.bidragsmottaker.visningsnavn).first()).toBeVisible();
    await expect(
        component.getByRole("button", { name: `Bruk ${testpersoner.bidragsmottaker.visningsnavn}` }),
    ).toHaveCount(0);
    await expect(component.getByRole("searchbox", { name: /Søk etter bidragsmottaker/ })).toHaveCount(0);
    await expectNoAxeViolations(page, component);
});

test("beholder kjente parter når barnet har to registrerte foreldre", async ({ mount, page }) => {
    await mockWizardApi(page, {
        parentRelations: {
            [testpersoner.barnUnder18.ident]: [testpersoner.bidragsmottaker.ident, testpersoner.annenForelder.ident],
        },
    });
    const component = await mount(STORY);

    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søkEtterBarn = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søkEtterBarn.fill(testpersoner.barnUnder18.ident);
    await søkEtterBarn.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();

    await expect(component.getByText(/har begge foreldre registrert/)).toBeVisible();
    await expect(
        component.getByRole("button", { name: `Bruk ${testpersoner.bidragsmottaker.visningsnavn}` }),
    ).toBeVisible();
    await expect(
        component.getByRole("button", { name: `Bruk ${testpersoner.annenForelder.visningsnavn}` }),
    ).toBeVisible();
    await expect(component.getByRole("searchbox", { name: /Søk etter bidragsmottaker/ })).toHaveCount(0);
});
