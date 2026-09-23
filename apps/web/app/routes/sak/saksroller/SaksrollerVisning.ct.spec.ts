import { lagSak, testpersoner } from "@ct/saksroller/fixtures.ts";
import { mockSaksrollerApi } from "@ct/saksroller/network.ts";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/SaksrollerVisning/Standard";

test.describe("SaksrollerVisning", () => {
    test("viser roller for saken hentet fra nettverket", async ({ mount, page }) => {
        await mockSaksrollerApi(page);
        const component = await mount(STORY);

        await expect(component.getByRole("heading", { name: "Rollebilde for sak 2024/1" })).toBeVisible();
        await expect(component.getByText(testpersoner.bidragsmottaker.visningsnavn)).toBeVisible();
        await expect(component.getByText(testpersoner.bidragspliktig.visningsnavn)).toBeVisible();
        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await expect(component.getByText("Barn i saken (1)")).toBeVisible();
    });

    test("lagrer endringer og viser suksessmelding", async ({ mount, page }) => {
        const { requests } = await mockSaksrollerApi(page);
        const component = await mount(STORY);

        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("radio", { name: "Barnet selv" }).check();
        await component.getByRole("button", { name: "Legg til", exact: true }).click();

        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();

        await expect(component.getByText("Saken ble oppdatert")).toBeVisible();
        expect(requests.update).toBeTruthy();
    });

    test("viser feilmelding når lagring feiler", async ({ mount, page }) => {
        await mockSaksrollerApi(page, {
            updateStatus: 500,
            updateBody: "Kunne ikke oppdatere sak. Vennligst prøv igjen.",
        });
        const component = await mount(STORY);

        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("radio", { name: "Barnet selv" }).check();
        await component.getByRole("button", { name: "Legg til", exact: true }).click();
        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();

        await expect(component.getByText("Kunne ikke oppdatere sak. Vennligst prøv igjen.").first()).toBeVisible();
        await component.getByRole("button", { name: "Endre reell mottaker" }).click();
        await expect(component.getByText("Kunne ikke oppdatere sak. Vennligst prøv igjen.")).toHaveCount(0);
    });

    test("blokkerer lagring når en redigering ikke er fullført", async ({ mount, page }) => {
        const { requests } = await mockSaksrollerApi(page);
        const component = await mount(STORY);

        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("radio", { name: "Barnet selv" }).check();

        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();

        await expect(component.getByText("Fullfør eller avbryt endringen som er i gang før du lagrer.")).toBeVisible();
        expect(requests.update).toBeFalsy();
    });

    test("fjerner info om manglende endringer når redigering starter", async ({ mount, page }) => {
        await mockSaksrollerApi(page);
        const component = await mount(STORY);

        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();
        await expect(component.getByText("Ingen endringer å lagre.")).toBeVisible();

        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await expect(component.getByText("Ingen endringer å lagre.")).toHaveCount(0);
    });

    test("skjuler barneseksjonen for ektefellebidragssaker", async ({ mount, page }) => {
        await mockSaksrollerApi(page, {
            sak: lagSak({
                roller: [
                    { fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM", rolleType: "BM" },
                    { fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP", rolleType: "BP" },
                ],
            }),
        });
        const component = await mount(STORY);

        await expect(component.getByText("Ektefellebidrag", { exact: true })).toBeVisible();
        await expect(
            component.getByText("Dette er en ektefellebidragssak og inneholder ikke barn. Saken kan ikke redigeres."),
        ).toBeVisible();
        await expect(component.getByText("Barn i saken")).toHaveCount(0);
    });
});
