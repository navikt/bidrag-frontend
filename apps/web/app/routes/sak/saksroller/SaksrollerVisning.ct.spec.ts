import { lagRolle, lagSak, testpersoner } from "@ct/saksroller/fixtures.ts";
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

    test("viser rollehistorikk for forelder og barn i modaler", async ({ mount, page }) => {
        await mockSaksrollerApi(page, {
            sak: lagSak({
                roller: [
                    lagRolle({
                        fodselsnummer: testpersoner.bidragsmottaker.ident,
                        type: "BM",
                        rolleType: "BM",
                        rollehistorikk: [
                            {
                                type: "BM",
                                typeEndring: "Satt til BM manuelt",
                                opprettetAv: "Z123456",
                                opprettetTidspunkt: "2024-03-04T12:00:00Z",
                            },
                        ],
                    }),
                    lagRolle({
                        fodselsnummer: testpersoner.barn.ident,
                        type: "BA",
                        rolleType: "BA",
                        rollehistorikk: [
                            {
                                type: "BA",
                                typeEndring: "Endret RM manuelt",
                                opprettetAv: "Z987654",
                                opprettetTidspunkt: "2024-05-06T12:00:00Z",
                            },
                        ],
                    }),
                ],
            }),
        });
        const component = await mount(STORY);

        await component.getByRole("button", { name: "Vis rollehistorikk" }).first().click();
        const forelderHistorikk = component.getByRole("dialog", { name: "Rollehistorikk" });
        await expect(forelderHistorikk).toBeVisible();
        await expect(forelderHistorikk.getByText(testpersoner.bidragsmottaker.visningsnavn)).toBeVisible();
        await expect(forelderHistorikk.getByText("Sak 2024/1")).toBeVisible();
        await expect(forelderHistorikk.getByRole("cell", { name: "Satt til BM manuelt" })).toBeVisible();
        await expect(forelderHistorikk.getByRole("cell", { name: "04.03.2024" })).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(forelderHistorikk).toHaveCount(0);
        await component.getByRole("button", { name: "Vis rollehistorikk" }).last().click();
        const barnHistorikk = component.getByRole("dialog", { name: "Rollehistorikk" });
        await expect(barnHistorikk.getByText(testpersoner.barn.visningsnavn)).toBeVisible();
        await expect(barnHistorikk.getByRole("cell", { name: "Endret RM manuelt" })).toBeVisible();
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

    test("avbryter valg av reell mottaker uten å lagre", async ({ mount, page }) => {
        const { requests } = await mockSaksrollerApi(page);
        const component = await mount(STORY);

        await expect(component.getByText(testpersoner.barn.visningsnavn, { exact: true })).toBeVisible();
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await component.getByRole("radio", { name: "Barnet selv" }).check();

        await expect(component.getByRole("dialog", { name: "Endre reell mottaker" })).toBeVisible();
        expect(requests.update).toBeFalsy();
        await component.getByRole("button", { name: "Avbryt" }).click();
        await expect(component.getByRole("dialog", { name: "Endre reell mottaker" })).toHaveCount(0);
        await component.getByRole("button", { name: /lagre/i }).filter({ hasNotText: "og" }).click();
        await expect(component.getByText("Ingen endringer å lagre.")).toBeVisible();
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
