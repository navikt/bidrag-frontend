import { expect, test } from "@playwright/test";

test.describe("ExpandedRoles", () => {
    test("viser rollekort for alle roller i saken", async ({ mount }) => {
        const component = await mount("react_components/header/ExpandedRoles/TreRoller");

        await expect(component.getByText("Kari Nordmann")).toBeVisible();
        await expect(component.getByText("Ola Nordmann")).toBeVisible();
        await expect(component.getByText("Lille Nordmann")).toBeVisible();
        await expect(component.getByText("BM", { exact: true })).toBeVisible();
        await expect(component.getByText("BP", { exact: true })).toBeVisible();
        await expect(component.getByText("BA", { exact: true })).toBeVisible();
    });

    test("rendrer ingenting når ingen saksnummer er ekspandert", async ({ mount }) => {
        const component = await mount("react_components/header/ExpandedRoles/IngenEkspandert");

        // Selve gallery-roten finnes, men panelet skal ikke ha noe innhold.
        await expect(component).toBeEmpty();
    });

    test("viser ett rollekort ved kun én rolle i saken", async ({ mount }) => {
        const component = await mount("react_components/header/ExpandedRoles/EnRolle");

        await expect(component.getByText("Kari Nordmann")).toBeVisible();
        await expect(component.getByRole("button", { name: /kopier/i })).toBeVisible();
    });
});
