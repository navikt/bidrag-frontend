import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import type { Page } from "@playwright/test";

const STORY = "routes/sak/saksroller/felles/ForeslåPersonPanel/Standard";

async function mockPersonInformasjonFørMount(page: Page, person: { ident: string; visningsnavn: string }) {
    await page.route("**/proxy/bidrag-person/informasjon/", async (route) => {
        const requestIdent = (route.request().postDataJSON() as { ident: string }).ident;
        if (requestIdent !== person.ident) {
            await route.fulfill({ status: 404, json: { message: "Fant ikke person" } });
            return;
        }
        await route.fulfill({ json: person });
    });
}

test.describe("ForeslåPersonPanel", () => {
    test("viser forslag og kaller callback når forslaget brukes", async ({ mount }) => {
        const component = await mount(STORY);

        await expect(component.getByRole("button", { name: "Bruk Kari Nordmann" })).toBeVisible();
        await component.getByRole("button", { name: "Bruk Kari Nordmann" }).click();

        await expect(component.getByTestId("brukt-forslag")).toHaveText("true");
        await expect(component.getByTestId("valgt-person")).toHaveText("Kari Nordmann");
    });

    test("åpner søk og sender valgt person til callback", async ({ mount, page }) => {
        const ident = genererFnr();
        await mockPersonInformasjonFørMount(page, { ident, visningsnavn: "Ola Nordmann" });

        const component = await mount(STORY);
        await component.getByRole("button", { name: "Velg annen person" }).click();
        await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();

        const søk = component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" });
        await søk.fill(ident);
        await søk.press("Enter");

        await expect(component.getByTestId("valgt-person")).toHaveText("Ola Nordmann");
    });

    test("viser flere forslag som egne bruk-knapper", async ({ mount }) => {
        const component = await mount("routes/sak/saksroller/felles/ForeslåPersonPanel/MedFlereForslag");

        const forslag = component.getByRole("button").filter({ hasText: "Kari Nordmann" });
        await expect(forslag).toBeVisible();
        await expect(component.getByText("Foreslåtte personer (2)")).toBeVisible();

        await forslag.click();
        await expect(component.getByTestId("valgt-person")).toHaveText("Kari Nordmann");
    });
});
