import { expect, test } from "@playwright/test";
import { testpersoner } from "./playwright/fixtures";
import { mockWizardApi } from "./playwright/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/OpprettSakFlyt/Standard";

test("endrer sakstype, søker person via nettverk og endrer valgt part", async ({ mount, page }) => {
    await mockWizardApi(page);
    const component = await mount(STORY);

    await expect(component.getByText("Barnebidrag", { exact: true })).toBeVisible();
    await component.getByRole("button", { name: "Endre" }).click();
    await component.getByRole("radio", { name: /Ektefellebidrag/ }).dispatchEvent("click");

    const search = component.getByRole("searchbox", { name: "Søk etter part" });
    await search.fill(testpersoner.bidragspliktig.ident);
    await component.getByRole("button", { name: "Søk", exact: true }).dispatchEvent("click");

    await expect(component.getByRole("button", { name: "Endre part" })).toBeVisible();
    await component.getByRole("button", { name: "Endre part" }).click();
    await expect(component.getByRole("searchbox", { name: "Søk etter part" })).toBeVisible();
});
