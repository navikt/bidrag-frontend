import type { Page } from "@playwright/test";

type Person = { ident: string } & Record<string, unknown>;

export async function mockPersonOgRelasjoner(
    page: Page,
    options: {
        testpersoner: Record<string, Person>;
        personOverrides?: Record<string, Record<string, unknown>>;
        foreldreTilBarn: (barnIdent: string) => string[];
        motpartPerson: unknown;
    },
) {
    const personer: Record<string, unknown> = {
        ...Object.fromEntries(Object.values(options.testpersoner).map((person) => [person.ident, person])),
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
                forelderBarnRelasjon: options.foreldreTilBarn(ident).map((relatertPersonsIdent) => ({
                    minRolleForPerson: "BARN",
                    relatertPersonsIdent,
                })),
            },
        });
    });
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({ json: { person: options.motpartPerson, personensMotpartBarnRelasjon: [] } });
    });
    await page.route(/\/log\/.*/, async (route) => route.fulfill({ status: 204 }));
}
