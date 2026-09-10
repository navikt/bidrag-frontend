import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, mockWizardApi } from "../../playwright/network";

const STANDARD = "routes/sak/saksroller/opprett-ny-sak/flyt/ForelderMedBarn/ForelderMedBarn/Standard";
const UKJENT = "routes/sak/saksroller/opprett-ny-sak/flyt/ForelderMedBarn/ForelderMedBarn/UkjentBidragsmottaker";

test.describe("Forelder med barn", () => {
    test("låser andre barnkurver, viser enhet og oppretter sak", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        const component = await mount(STANDARD);

        await component.getByRole("checkbox").first().check();

        await expect(component.getByText("Deaktivert (barn valgt fra annen kurv)")).toBeVisible();
        await expect(component.getByText(/Saken vil bli sendt til enhet NAV Test \(4806\)/)).toBeVisible();
        await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();
        await expectNoAxeViolations(page, component);

        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();
        expect(requests.create?.roller).toHaveLength(3);
    });

    test("viser relasjons- og tilgangsadvarsel når bidragsmottaker er ukjent", async ({ mount, page }) => {
        await mockWizardApi(page, { accessAllowed: false });
        const component = await mount(UKJENT);

        await component.getByRole("checkbox").first().check();

        await expect(component.getByText(/manglende eller ufullstendig relasjon/)).toBeVisible();
        await expect(component.getByText(/ikke tilgang til å opprette sak uten bidragsmottaker/)).toBeVisible();
        await expect(component.getByText("Reell mottaker", { exact: true }).first()).toBeVisible();
    });
});
