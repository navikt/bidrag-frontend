import { expectNoAxeViolations, mockWizardApi } from "@ct/opprett-ny-sak/network";
import { expect, test } from "@playwright/test";

const STORY = "routes/sak/saksroller/opprett-ny-sak/flyt/BarnBeggeForeldre/BarnBeggeForeldre/Standard";

test.describe("Barn med begge foreldre", () => {
    test("bytter roller når en annen bidragspliktig velges", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(STORY);

        await expect(component.getByRole("heading", { name: "Barn" })).toBeVisible();
        await expect(component.getByText("Velg roller for foreldrene før du velger reell mottaker.")).toBeVisible();
        const seksjonsoverskrifter = await component.getByRole("heading", { level: 2 }).allTextContents();
        expect(seksjonsoverskrifter.indexOf("Barn")).toBeLessThan(seksjonsoverskrifter.indexOf("Foreldre"));

        const førsteForelder = component.getByRole("radiogroup", { name: /Test Bidragspliktig/ });
        const andreForelder = component.getByRole("radiogroup", { name: /Test Bidragsmottaker/ });

        await førsteForelder.getByRole("radio", { name: "Bidragspliktig" }).check();
        await expect(andreForelder.getByRole("radio", { name: "Bidragsmottaker" })).toBeChecked();

        await andreForelder.getByRole("radio", { name: "Bidragspliktig" }).check();
        await expect(førsteForelder.getByRole("radio", { name: "Bidragsmottaker" })).toBeChecked();

        await component.getByRole("button", { name: "Sett bidragsmottaker som ukjent" }).click();
        await component.getByRole("button", { name: "Bruk registrert forelder" }).click();
        await expect(component.getByRole("button", { name: "Sett bidragsmottaker som ukjent" })).toBeVisible();
        await expectNoAxeViolations(page, component);
    });

    test("eksisterende sak sperrer opprettelse", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(STORY);
        const bidragspliktigGruppe = component.getByRole("radiogroup", { name: /Test Bidragspliktig/ });
        const visteIdenter = component.getByText(/^\d{11}$/);
        const bidragspliktigIdent = await visteIdenter.nth(1).textContent();
        const bidragsmottakerIdent = await visteIdenter.nth(2).textContent();
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
        await bidragspliktigGruppe.getByRole("radio", { name: "Bidragspliktig" }).check();

        await expect(component.getByText(/7654321/)).toBeVisible();
        expect(bidragspliktigIdent).toBeTruthy();
        const opprettKnapp = component.getByRole("button", { name: /Opprett$/ });
        await expect(opprettKnapp).toBeEnabled();
        await opprettKnapp.click();
        await expect(
            component.getByText("Kan ikke opprette saken ennå. Kontroller feltene og meldingene over."),
        ).toBeVisible();

        const bidragsmottakerGruppe = component.getByRole("radiogroup", { name: /Test Bidragsmottaker/ });
        await bidragsmottakerGruppe.getByRole("radio", { name: "Bidragspliktig" }).check();
        await expect(
            component.getByText("Kan ikke opprette saken ennå. Kontroller feltene og meldingene over."),
        ).toHaveCount(0);
        await expectNoAxeViolations(page, component);
    });

    test("eksisterende sak UTEN barn sperrer ikke opprettelse", async ({ mount, page }) => {
        await mockWizardApi(page);
        const component = await mount(STORY);
        const bidragspliktigGruppe = component.getByRole("radiogroup", { name: /Test Bidragspliktig/ });
        const bidragsmottakerIdent = await component
            .getByText(/^\d{11}$/)
            .nth(2)
            .textContent();
        await page.route(/\/proxy\/bidrag-sak\/person\/sak$/, async (route) => {
            const etterspurtIdent = JSON.parse(route.request().postData() ?? '""') as string;
            await route.fulfill({
                json: [
                    {
                        saksnummer: "1234567",
                        roller: [
                            { fodselsnummer: etterspurtIdent, type: "BP" },
                            { fodselsnummer: bidragsmottakerIdent, type: "BM" },
                        ],
                    },
                ],
            });
        });
        await bidragspliktigGruppe.getByRole("radio", { name: "Bidragspliktig" }).check();

        await expect(component.getByText(/1234567/)).not.toBeVisible();
        await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();
    });
});
