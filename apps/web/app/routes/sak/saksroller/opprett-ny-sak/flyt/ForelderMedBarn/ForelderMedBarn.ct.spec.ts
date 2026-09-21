import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

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

    test("nullstiller ikke skjemaet ved forsøk på å legge til allerede valgt barn manuelt", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        const component = await mount(STANDARD);

        // Barnet velges fra kurven, som gjør resten av skjemaet gyldig (motpart følger med kurven).
        await component.getByRole("checkbox").first().check();
        await expect(component.getByRole("checkbox").first()).toBeChecked();
        const selectedChildIdent = await component.getByRole("checkbox").first().getAttribute("value");
        expect(selectedChildIdent).toBeTruthy();

        // Prøver å legge til det samme barnet på nytt via manuell registrering.
        await component.getByRole("button", { name: "Legg til barn manuelt" }).click();
        await page.getByRole("searchbox", { name: "Oppgi barn i saken manuelt" }).fill(selectedChildIdent ?? "");
        await page.getByRole("button", { name: "Søk", exact: true }).click();

        // Skjemaet skal bestå og vise feilmelding, ikke sende inn/opprette saken og nullstille alt.
        await expect(page.getByText(/allerede i listen over valgte barn/)).toBeVisible();
        await expect(component.getByRole("checkbox").first()).toBeChecked();
        expect(requests.create).toBeUndefined();

        await page.getByRole("button", { name: "Avbryt" }).click();
        await component.getByRole("button", { name: "Legg til barn manuelt" }).click();
        const søkefelt = page.getByRole("searchbox", { name: "Oppgi barn i saken manuelt" });
        await søkefelt.fill(selectedChildIdent ?? "");
        await søkefelt.press("Enter");

        await expect(page.getByText(/allerede i listen over valgte barn/)).toBeVisible();
        await expect(component.getByRole("checkbox").first()).toBeChecked();
        expect(requests.create).toBeUndefined();
    });

    test("laster ikke siden på nytt når sak opprettes uten navigering", async ({ mount, page }) => {
        const requests = await mockWizardApi(page);
        const component = await mount(STANDARD);

        // Overlever kun dersom dokumentet ikke lastes på nytt.
        await page.evaluate(() => {
            (window as unknown as { __sammeDokument?: boolean }).__sammeDokument = true;
        });

        await component.getByRole("checkbox").first().check();
        await component.getByRole("button", { name: /Opprett$/ }).click();
        await expect.poll(() => requests.create).toBeTruthy();

        await expect
            .poll(() => page.evaluate(() => (window as unknown as { __sammeDokument?: boolean }).__sammeDokument))
            .toBe(true);
        await expect(component.getByRole("checkbox").first()).toBeAttached();
    });
});
