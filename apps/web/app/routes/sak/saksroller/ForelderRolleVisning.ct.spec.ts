import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const STORY_BEGGE_KJENT = "routes/sak/saksroller/ForelderRolleVisning/BeggeRollerISak";
const STORY_BM_MANGLER = "routes/sak/saksroller/ForelderRolleVisning/BidragsmottakerMangler";
const STORY_BP_MANGLER = "routes/sak/saksroller/ForelderRolleVisning/BidragspliktigMangler";
const STORY_NY_BP = "routes/sak/saksroller/ForelderRolleVisning/NyBidragspliktigKanFjernes";

async function mockPersonInformasjonForIdentFørMount(page: Page, ident: string, visningsnavn: string) {
    await page.route("**/proxy/bidrag-person/informasjon/", async (route) => {
        const requestIdent = (route.request().postDataJSON() as { ident: string }).ident;
        const navnForRequest = requestIdent === ident ? visningsnavn : "Ukjent";
        await route.fulfill({ json: { ident: requestIdent, visningsnavn: navnForRequest } });
    });
}

test.describe("ForelderRolleVisning", () => {
    test("viser begge roller side om side i samme grid når begge er kjent fra start", async ({ mount }) => {
        const component = await mount(STORY_BEGGE_KJENT);

        await expect(component.getByRole("heading", { name: "Bidragspliktig", level: 2 })).toBeVisible();
        await expect(component.getByText("Ola Nordmann")).toBeVisible();

        await expect(component.getByRole("heading", { name: "Bidragsmottaker", level: 2 })).toBeVisible();
        await expect(component.getByText("Kari Nordmann")).toBeVisible();

        await expect(component.getByRole("button", { name: "Legg til person" })).toHaveCount(0);
    });

    test("bidragsmottaker mangler (unntak) - viser 'Ukjent - ikke registrert' og 'Legg til person'", async ({
        mount,
    }) => {
        const component = await mount(STORY_BM_MANGLER);

        await expect(component.getByText("Ola Nordmann")).toBeVisible();
        await expect(component.getByText("Ukjent - ikke registrert")).toBeVisible();
        await expect(component.getByRole("button", { name: "Legg til person" })).toBeVisible();
    });

    test("bidragspliktig mangler (unntak, f.eks. farskapssak) - viser 'Ukjent - ikke registrert' og 'Legg til person'", async ({
        mount,
    }) => {
        const component = await mount(STORY_BP_MANGLER);

        await expect(component.getByText("Kari Nordmann")).toBeVisible();
        await expect(component.getByText("Ukjent - ikke registrert")).toBeVisible();
        await expect(component.getByRole("button", { name: "Legg til person" })).toBeVisible();
    });

    test("nylig lagt til bidragspliktig viser 'Ny'-merke og kan fjernes igjen via Fjern-knappen", async ({ mount }) => {
        const component = await mount(STORY_NY_BP);

        await expect(component.getByText("Ny", { exact: true })).toBeVisible();
        await expect(component.getByRole("button", { name: "Endre" })).toBeVisible();

        await component.getByRole("button", { name: "Fjern" }).click();

        await expect(component.getByText("Ola Nordmann")).toHaveCount(0);
        await expect(component.getByText("Kari Nordmann")).toBeVisible();
        await expect(component.getByRole("button", { name: "Legg til person" })).toHaveCount(1);
    });

    test("uthevPerson (context-mock, ikke useHentPersonData/'personer') fremhever kun bidragspliktig", async ({
        mount,
    }) => {
        const component = await mount(STORY_BEGGE_KJENT);
        const identRaderMedFremheving = component.locator('[data-uthevet="true"]');

        await expect(identRaderMedFremheving).toHaveCount(1);
    });

    test("klikk på 'Legg til person' for manglende bidragsmottaker åpner søkevisning", async ({ mount }) => {
        const component = await mount(STORY_BM_MANGLER);

        await component.getByRole("button", { name: "Legg til person" }).click();

        await expect(component.getByRole("heading", { name: "Legg til bidragsmottaker" })).toBeVisible();
    });

    test("søker opp og legger til bidragsmottaker - mocker et ekte nettverkskall (ikke context)", async ({
        mount,
        page,
    }) => {
        const bmIdent = "01019012345";

        await mockPersonInformasjonForIdentFørMount(page, bmIdent, "Kari Nordmann");
        const component = await mount(STORY_BM_MANGLER);

        await component.getByRole("button", { name: "Legg til person" }).click();
        await component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" }).fill(bmIdent);
        await component.getByRole("button", { name: "Søk", exact: true }).click();

        await expect(component.getByText("Kari Nordmann")).toBeVisible();
        await expect(component.getByRole("button", { name: "Legg til person" })).toHaveCount(0);
    });
});
