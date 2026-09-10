import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";
import { samhandler, testpersoner } from "./fixtures";

type MockOptions = {
    existingCases?: unknown[];
    createStatus?: number;
    createBody?: unknown;
    accessAllowed?: boolean;
    unit?: { nummer: string; navn: string };
    parentRelations?: Record<string, string[]>;
    personOverrides?: Record<string, Record<string, unknown>>;
};

export async function mockWizardApi(page: Page, options: MockOptions = {}) {
    const requests: { create?: Record<string, unknown>; unit: Record<string, unknown>[] } = { unit: [] };
    const personer = {
        ...Object.fromEntries(Object.values(testpersoner).map((person) => [person.ident, person])),
        ...options.personOverrides,
    };

    await page.route(/\/proxy\/bidrag-person\/informasjon\/?$/, async (route) => {
        const { ident } = route.request().postDataJSON() as { ident: string };
        await route.fulfill({ json: personer[ident] ?? { ident, visningsnavn: "Test Ukjent Person" } });
    });
    await page.route(/\/proxy\/bidrag-person\/forelderbarnrelasjon$/, async (route) => {
        const { ident } = route.request().postDataJSON() as { ident: string };
        await route.fulfill({
            json: {
                forelderBarnRelasjon: (options.parentRelations?.[ident] ?? []).map((relatertPersonsIdent) => ({
                    minRolleForPerson: "BARN",
                    relatertPersonsIdent,
                })),
            },
        });
    });
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({ json: { person: testpersoner.bidragspliktig, personensMotpartBarnRelasjon: [] } });
    });
    await page.route(/\/proxy\/bidrag-sak\/person\/sak$/, async (route) => {
        await route.fulfill({ json: options.existingCases ?? [] });
    });
    await page.route(/\/proxy\/bidrag-organisasjon\/arbeidsfordeling\/enhet\/geografisktilknytning$/, async (route) => {
        requests.unit.push(route.request().postDataJSON() as Record<string, unknown>);
        await route.fulfill({ json: options.unit ?? { nummer: "4806", navn: "NAV Test" } });
    });
    await page.route(/\/proxy\/bidrag-tilgangskontroll\/v2\/api\/tilgang\/opprettsakutenbm$/, async (route) => {
        await route.fulfill({ json: { harTilgang: options.accessAllowed ?? true } });
    });
    await page.route(/\/proxy\/bidrag-samhandler\/samhandler$/, async (route) => {
        await route.fulfill({ json: samhandler });
    });
    await page.route(/\/proxy\/bidrag-sak\/sak$/, async (route) => {
        requests.create = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
            status: options.createStatus ?? 200,
            json: options.createBody ?? { saksnummer: "1234567" },
        });
    });
    await page.route(/\/log\/.*/, async (route) => route.fulfill({ status: 204 }));

    return requests;
}

export async function expectNoAxeViolations(page: Page, component: Locator) {
    const rootId = await component.getAttribute("id");
    const result = await new AxeBuilder({ page })
        .include(`#${rootId ?? "root"}`)
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
    expect(result.violations).toEqual([]);
}
