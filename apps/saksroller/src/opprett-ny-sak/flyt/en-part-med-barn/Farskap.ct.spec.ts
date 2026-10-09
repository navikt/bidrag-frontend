import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { testpersoner } from "../../../../playwright/opprett-ny-sak/fixtures";
import { expectNoAxeViolations, mockOpprettSakApi } from "../../../../playwright/opprett-ny-sak/network";

const STORY = "opprett-ny-sak/flyt/en-part-med-barn/Farskap/Standard";

test("krever barn, bruker arbeidsfordeling FRS og oppretter farskapssak", async ({ mount, page }) => {
    const requests = await mockOpprettSakApi(page);
    const component = await mount(STORY);

    const opprettKnapp = component.getByRole("button", { name: /Opprett$/ });
    await expect(opprettKnapp).toBeEnabled();
    await opprettKnapp.click();
    await expect(component.getByText("Du må velge minst ett barn.")).toBeVisible();

    await component
        .getByRole("checkbox", { name: /^Velg (?!alle)/ })
        .first()
        .check();
    await expect.poll(() => requests.unit.some((request) => request.arbeidsfordeling === "FRS")).toBe(true);
    await expectNoAxeViolations(page, component);

    await opprettKnapp.click();
    await expect.poll(() => requests.create).toBeTruthy();
    expect(requests.create).toMatchObject({ arbeidsfordeling: "FRS" });
    expect((requests.create?.roller as { type: string }[]).map((r) => r.type)).toContain("BA");
});

test("parten det ble startet fra kan endres", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });

    await bmKort.getByRole("button", { name: "Endre bidragsmottaker" }).click();
    await expect(bmKort.getByRole("paragraph").filter({ hasText: /^Velg bidragsmottaker$/ })).toBeVisible();
    await expect(bmKort.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();

    await component.getByRole("button", { name: /Opprett$/ }).click();
    await expect(component.getByText("Du må registrere bidragsmottaker")).toBeVisible();
    await expectNoAxeViolations(page, component);
});

test("nytt barn erstatter det forrige fordi farskap bare kan gjelde ett barn", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    const førsteBarn = component.getByRole("checkbox", { name: /^Velg (?!alle)/ }).first();
    const andreBarn = component.getByRole("checkbox", { name: /^Velg (?!alle)/ }).nth(1);

    await førsteBarn.check();
    await andreBarn.check();

    await expect(andreBarn).toBeChecked();
    await expect(førsteBarn).not.toBeChecked();
    await expect(component.getByText("1 valgt")).toBeVisible();
});

test("viser helsøsken sammen med manuelt valgt barn", async ({ mount, page }) => {
    const manueltBarn = { ident: genererFnr(), visningsnavn: "Test Manuelt Barn", fødselsdato: "2014-05-01" };
    const søsken = { ident: genererFnr(), visningsnavn: "Test Søsken", fødselsdato: "2016-06-01" };
    await mockOpprettSakApi(page, {
        parentRelations: {
            [manueltBarn.ident]: [testpersoner.bidragspliktig.ident, testpersoner.annenForelder.ident],
        },
        personOverrides: { [manueltBarn.ident]: manueltBarn, [søsken.ident]: søsken },
    });
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        const { ident } = route.request().postDataJSON() as { ident: string };
        const forelder = ident === testpersoner.bidragspliktig.ident;
        const person = forelder ? testpersoner.bidragspliktig : testpersoner.annenForelder;
        await route.fulfill({
            json: {
                person,
                personensMotpartBarnRelasjon: [
                    {
                        forelderrolleMotpart: forelder ? "MOR" : "FAR",
                        motpart: forelder ? testpersoner.annenForelder : testpersoner.bidragspliktig,
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
    for (const forelder of [testpersoner.bidragspliktig, testpersoner.annenForelder]) {
        const søskenGruppe = component.getByRole("group", { name: `Velg barn med ${forelder.visningsnavn}` });
        await expect(søskenGruppe.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` })).toBeChecked();
        await expect(søskenGruppe.getByRole("checkbox", { name: `Velg ${søsken.visningsnavn}` })).toBeVisible();
    }
    await expect(component.getByText("Barn lagt til manuelt", { exact: true })).toHaveCount(0);
});

test("viser en melding når tilgang til søskenrelasjoner mangler", async ({ mount, page }) => {
    const manueltBarn = { ident: genererFnr(), visningsnavn: "Test Manuelt Barn", fødselsdato: "2014-05-01" };
    await mockOpprettSakApi(page, {
        parentRelations: { [manueltBarn.ident]: [testpersoner.bidragspliktig.ident] },
        personOverrides: { [manueltBarn.ident]: manueltBarn },
    });
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({ status: 403 });
    });
    const component = await mount(STORY);

    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søk.fill(manueltBarn.ident);
    await søk.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();

    await expect(
        component.getByText("Kunne ikke hente foreldre og søsken for barnet. Du kan søke opp barn manuelt."),
    ).toBeVisible();
    await expect(component.getByRole("checkbox", { name: `Velg ${manueltBarn.visningsnavn}` })).toBeChecked();
});

test("barnekortet har kopier og Modia utenfor avkrysningen", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    const barn = component.getByRole("checkbox", { name: /^Velg (?!alle)/ }).first();

    await expect(component.getByRole("link", { name: "Åpne personen i Modia" }).first()).toBeVisible();
    await component
        .getByRole("button", { name: /kopier/i })
        .first()
        .click();
    await expect(barn).not.toBeChecked();

    await barn.check();
    await expect(barn).toBeChecked();
});
