import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, mockWizardApi } from "../playwright/network";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/BarnBeggeForeldre/Standard";

test.describe("Barn med begge foreldre", () => {
    test("bytter roller når en annen bidragspliktig velges", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(STORY);

        await component.getByRole("radio", { name: /Test Bidragspliktig/ }).check();
        await expect(component.getByRole("radio", { name: /Test Bidragspliktig/ })).toBeChecked();

        await component.getByRole("radio", { name: /Test Bidragsmottaker/ }).check();
        await expect(component.getByRole("radio", { name: /Test Bidragsmottaker/ })).toBeChecked();
        await expectNoAxeViolations(page, component);
    });

    test("eksisterende sak sperrer opprettelse", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(STORY);
        const foreldre = component.getByRole("radio");
        const bidragspliktigIdent = await foreldre.nth(0).getAttribute("value");
        const bidragsmottakerIdent = await foreldre.nth(1).getAttribute("value");
        await page.route(/\/proxy\/bidrag-sak\/person\/sak$/, async (route) => {
            const etterspurtIdent = JSON.parse(route.request().postData() ?? '""') as string;
            await route.fulfill({
                json: [
                    {
                        saksnummer: "7654321",
                        roller: [
                            { fodselsnummer: etterspurtIdent, type: "BP" },
                            { fodselsnummer: bidragsmottakerIdent, type: "BM" },
                            { fodselsnummer: "barn", type: "BA" },
                        ],
                    },
                ],
            });
        });
        await foreldre.nth(0).check();

        await expect(component.getByText(/7654321/)).toBeVisible();
        expect(bidragspliktigIdent).toBeTruthy();
        await expect(component.getByRole("button", { name: /Opprett$/ })).toBeDisabled();
    });
});
