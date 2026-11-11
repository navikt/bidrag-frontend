import type { Page } from "@playwright/test";
import { mockPersonOgRelasjoner } from "../felles/personMock.ts";
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

    await page.route(
        (url) => /\/proxy\/bidrag-sak\/bidrag-sak\/sak\//.test(url.pathname) && url.pathname.endsWith(sak.saksnummer),
        async (route) => {
            await route.fulfill({ json: sak });
        },
    );
    await mockPersonOgRelasjoner(page, {
        testpersoner,
        personOverrides: options.personOverrides,
        foreldreTilBarn: () => [testpersoner.bidragsmottaker.ident, testpersoner.bidragspliktig.ident],
        motpartPerson: null,
    });
    await page.route(/\/proxy\/bidrag-sak\/sak\/oppdater\/roller$/, async (route) => {
        requests.update = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
            status: options.updateStatus ?? 200,
            json: options.updateBody ?? { saksnummer: sak.saksnummer },
        });
    });

    return { requests };
}
