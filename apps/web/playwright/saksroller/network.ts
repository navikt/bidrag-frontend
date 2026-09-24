import type { Page } from "@playwright/test";
import { lagSak, testpersoner } from "./fixtures.ts";

type Sak = { saksnummer: string } & Record<string, unknown>;

type MockOptions = {
    sak?: Sak;
    updateStatus?: number;
    updateBody?: unknown;
    personOverrides?: Record<string, Record<string, unknown>>;
};

export async function mockSaksrollerApi(page: Page, options: MockOptions = {}) {
    const requests: { update?: Record<string, unknown> } = {};
    const sak: Sak = options.sak ?? lagSak();
    const personer = {
        ...Object.fromEntries(Object.values(testpersoner).map((person) => [person.ident, person])),
        ...options.personOverrides,
    };

    await page.route(
        (url) => /\/proxy\/bidrag-sak\/bidrag-sak\/sak\//.test(url.pathname) && url.pathname.endsWith(sak.saksnummer),
        async (route) => {
            await route.fulfill({ json: sak });
        },
    );
    await page.route(/\/proxy\/bidrag-person\/informasjon\/?$/, async (route) => {
        const { ident } = route.request().postDataJSON() as { ident: string };
        await route.fulfill({ json: personer[ident] ?? { ident, visningsnavn: "Test Ukjent Person" } });
    });
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({ json: { person: null, personensMotpartBarnRelasjon: [] } });
    });
    await page.route(/\/proxy\/bidrag-person\/forelderbarnrelasjon$/, async (route) => {
        await route.fulfill({
            json: {
                forelderBarnRelasjon: [
                    { minRolleForPerson: "BARN", relatertPersonsIdent: testpersoner.bidragsmottaker.ident },
                    { minRolleForPerson: "BARN", relatertPersonsIdent: testpersoner.bidragspliktig.ident },
                ],
            },
        });
    });
    await page.route(/\/proxy\/bidrag-sak\/sak\/oppdater\/roller$/, async (route) => {
        requests.update = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
            status: options.updateStatus ?? 200,
            json: options.updateBody ?? { saksnummer: sak.saksnummer },
        });
    });
    await page.route(/\/log\/.*/, async (route) => route.fulfill({ status: 204 }));

    return { requests };
}
