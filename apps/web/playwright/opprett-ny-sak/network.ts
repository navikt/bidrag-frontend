import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";
import { mockPersonOgRelasjoner } from "../felles/personMock";
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
    await mockPersonOgRelasjoner(page, {
        testpersoner,
        personOverrides: options.personOverrides,
        foreldreTilBarn: (ident) => options.parentRelations?.[ident] ?? [],
        motpartPerson: testpersoner.bidragspliktig,
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

    return requests;
}

/**
 * Kjent brudd som stammer fra designsystemet og ikke kan rettes i denne kodebasen.
 * Kun noder som treffer både regel og selektor godtas, slik at samme regel fortsatt
 * fanger brudd andre steder i komponenten.
 */
export type GodtattBrudd = {
    regel: string;
    selektor: string;
    begrunnelse: string;
};

export const AKSEL_MODAL_SECONDARY_KNAPP_KONTRAST: GodtattBrudd = {
    regel: "color-contrast",
    selektor: '.aksel-modal__footer > .aksel-button--medium[data-variant="secondary"]',
    begrunnelse: "Aksel secondary-knapp i modal-footer: #4285c9 på hvit gir 3.86:1, WCAG AA krever 4.5:1",
};

export async function expectNoAxeViolations(
    page: Page,
    component: Locator,
    { tillattBrudd = [] }: { tillattBrudd?: GodtattBrudd[] } = {},
) {
    const rootId = await component.getAttribute("id");
    const result = await new AxeBuilder({ page })
        .include(`#${rootId ?? "root"}`)
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

    const gjenståendeBrudd = result.violations
        .map((brudd) => ({
            ...brudd,
            nodes: brudd.nodes.filter(
                (node) =>
                    !tillattBrudd.some(
                        (godtatt) =>
                            godtatt.regel === brudd.id &&
                            node.target.some((mål) => String(mål).includes(godtatt.selektor)),
                    ),
            ),
        }))
        .filter((brudd) => brudd.nodes.length > 0);

    expect(gjenståendeBrudd).toEqual([]);
}
