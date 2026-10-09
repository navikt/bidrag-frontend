import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { samhandler, testpersoner } from "../../../../playwright/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockOpprettSakApi } from "../../../../playwright/opprett-ny-sak/network";

const STORY = "opprett-ny-sak/flyt/en-part-med-barn/Oppfostringsbidrag/Standard";

test("krever samhandler som reell mottaker, bruker arbeidsfordeling OPS og oppretter sak", async ({ mount, page }) => {
    const requests = await mockOpprettSakApi(page);
    const component = await mount(STORY);

    await component
        .getByRole("checkbox", { name: /^Velg (?!alle)/ })
        .first()
        .check();

    await expect(component.getByText(/Barnet selv kan ikke velges som reell mottaker/).first()).toBeVisible();
    await expect(component.getByRole("button", { name: "Legg til reell mottaker" })).toHaveCount(0);
    await expect(component.getByText("Du må registrere reell mottaker")).toHaveCount(0);
    const opprettKnapp = component.getByRole("button", { name: /Opprett$/ });
    await expect(opprettKnapp).toBeEnabled();
    await opprettKnapp.click();
    await expect(component.getByText("Du må registrere reell mottaker")).toBeVisible();

    const search = component.getByRole("searchbox", { name: "Person- eller samhandlerident" });
    await search.fill(samhandler.samhandlerId);
    await search.press("Enter");
    await expect(component.getByText(samhandler.navn).first()).toBeVisible();

    await expect.poll(() => requests.unit.some((request) => request.arbeidsfordeling === "OPS")).toBe(true);
    await expectNoAxeViolations(page, component);

    await opprettKnapp.click();
    await expect.poll(() => requests.create).toBeTruthy();
    expect(requests.create).toMatchObject({ arbeidsfordeling: "OPS" });
    expect(JSON.stringify(requests.create)).toContain(samhandler.samhandlerId);
});

test("viser helsøsken sammen med manuelt valgt barn", async ({ mount, page }) => {
    const manueltBarn = { ident: genererFnr(), visningsnavn: "Test Manuelt Barn", fødselsdato: "2014-05-01" };
    const søsken = { ident: genererFnr(), visningsnavn: "Test Søsken", fødselsdato: "2016-06-01" };
    await mockOpprettSakApi(page, {
        parentRelations: {
            [manueltBarn.ident]: [testpersoner.bidragsmottaker.ident, testpersoner.annenForelder.ident],
        },
        personOverrides: { [manueltBarn.ident]: manueltBarn, [søsken.ident]: søsken },
    });
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        const { ident } = route.request().postDataJSON() as { ident: string };
        const forelder = ident === testpersoner.bidragsmottaker.ident;
        const person = forelder ? testpersoner.bidragsmottaker : testpersoner.annenForelder;
        await route.fulfill({
            json: {
                person,
                personensMotpartBarnRelasjon: [
                    {
                        forelderrolleMotpart: forelder ? "FAR" : "MOR",
                        motpart: forelder ? testpersoner.annenForelder : testpersoner.bidragsmottaker,
                        fellesBarn: [manueltBarn, søsken],
                    },
                ],
            },
        });
    });
    const component = await mount(STORY);

    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søk.fill(manueltBarn.ident);
    await søk.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();

    const søskenValg = component.getByRole("checkbox", { name: `Velg ${søsken.visningsnavn}` });
    await expect(søskenValg).toHaveCount(2);
    await expect(søskenValg.nth(0)).toBeVisible();
    await expect(søskenValg.nth(0)).not.toBeChecked();
    await expect(søskenValg.nth(1)).not.toBeChecked();
    await expect(component.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` })).toHaveCount(2);
    for (const forelder of [testpersoner.bidragsmottaker, testpersoner.annenForelder]) {
        const søskenGruppe = component.getByRole("group", { name: `Velg barn med ${forelder.visningsnavn}` });
        await expect(søskenGruppe.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` })).toBeChecked();
        await expect(søskenGruppe.getByRole("checkbox", { name: `Velg ${søsken.visningsnavn}` })).toBeVisible();
    }
    await expect(component.getByText("Barn lagt til manuelt", { exact: true })).toHaveCount(0);
});

test("tømmer søkefeltet ved treff og fjerner valgt samhandler med Fjern reell mottaker", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await component
        .getByRole("checkbox", { name: /^Velg (?!alle)/ })
        .first()
        .check();

    const search = component.getByRole("searchbox", { name: "Person- eller samhandlerident" });
    await search.fill(samhandler.samhandlerId);
    await search.press("Enter");
    await expect(component.getByText(samhandler.navn).first()).toBeVisible();
    await expect(search).toHaveValue("");

    await component.getByRole("button", { name: "Fjern reell mottaker" }).click();
    await expect(component.getByText(samhandler.navn)).toHaveCount(0);
});
