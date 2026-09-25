import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { lagRolle, lagSak } from "@ct/saksroller/fixtures.ts";
import { mockSaksrollerApi } from "@ct/saksroller/network.ts";
import type { Locator, Page } from "@playwright/test";

const SAKSROLLER = "routes/sak/saksroller/SaksrollerVisning/Standard";
const FORELDER_STORIES = [
    "BeggeRollerISak",
    "BidragsmottakerMangler",
    "BidragspliktigMangler",
    "NyBidragspliktigKanFjernes",
    "BidragspliktigManglerMedPlassholderRolle",
];
const BARN_STORIES = ["UtenReellMottaker", "NyttBarnKanFjernes", "PåkrevdReellMottaker"];

const personer = {
    bidragsmottaker: { ident: "21068712345", visningsnavn: "Test Bidragsmottaker", fødselsdato: "1987-06-21" },
    bidragspliktig: { ident: "14028512345", visningsnavn: "Test Bidragspliktig", fødselsdato: "1985-02-14" },
    barn: { ident: "12041512345", visningsnavn: "Test Barn", fødselsdato: "2015-04-12" },
};

const rolleBM = lagRolle({ fodselsnummer: personer.bidragsmottaker.ident, type: "BM", rolleType: "BM" });
const rolleBP = lagRolle({ fodselsnummer: personer.bidragspliktig.ident, type: "BP", rolleType: "BP" });
const rolleBA = lagRolle({ fodselsnummer: personer.barn.ident, type: "BA", rolleType: "BA" });

async function mockSak(page: Page, roller: Record<string, unknown>[]) {
    await mockSaksrollerApi(page, {
        sak: lagSak({ roller }),
        personOverrides: Object.fromEntries(Object.values(personer).map((person) => [person.ident, person])),
    });
    await page.route(/\/proxy\/bidrag-person\/forelderbarnrelasjon$/, async (route) => {
        await route.fulfill({
            json: {
                forelderBarnRelasjon: [personer.bidragsmottaker.ident, personer.bidragspliktig.ident].map(
                    (relatertPersonsIdent) => ({ minRolleForPerson: "BARN", relatertPersonsIdent }),
                ),
            },
        });
    });
}

async function gjørDeterministisk(page: Page) {
    await page.clock.setFixedTime(new Date("2026-01-15T12:00:00Z"));
    await page.addInitScript(() => {
        let frø = 42;
        Math.random = () => {
            frø = (frø * 16807) % 2147483647;
            return (frø - 1) / 2147483646;
        };
    });
}

async function sammenlign(locator: Locator, navn: string) {
    await locator.page().waitForLoadState("networkidle");
    await expect(locator).toHaveScreenshot(`${navn}.png`);
}

test.describe("Utseende på endre rolle-siden", () => {
    test.skip(!!process.env.CI, "Skjermbildene er tatt lokalt og er plattformavhengige");

    test.beforeEach(async ({ page }) => {
        await gjørDeterministisk(page);
    });

    test("rollebilde med BM, BP og barn", async ({ mount, page }) => {
        await mockSak(page, [rolleBM, rolleBP, rolleBA]);
        const component = await mount(SAKSROLLER);
        await sammenlign(component, "saksroller-standard");
    });

    test("rollehistorikk-modal", async ({ mount, page }) => {
        await mockSak(page, [
            {
                ...rolleBM,
                rollehistorikk: [
                    {
                        type: "BM",
                        typeEndring: "Satt til BM manuelt",
                        opprettetAv: "Z123456",
                        opprettetTidspunkt: "2024-03-04T12:00:00Z",
                    },
                ],
            },
            rolleBA,
        ]);
        const component = await mount(SAKSROLLER);
        await component.getByRole("button", { name: "Vis rollehistorikk" }).first().click();
        await sammenlign(page.getByRole("dialog", { name: "Rollehistorikk" }), "rollehistorikk-modal");
    });

    test("reell mottaker-modal", async ({ mount, page }) => {
        await mockSak(page, [rolleBM, rolleBP, rolleBA]);
        const component = await mount(SAKSROLLER);
        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();
        await sammenlign(page.getByRole("dialog", { name: "Endre reell mottaker" }), "reell-mottaker-modal");
    });

    test("legg til barn-modal", async ({ mount, page }) => {
        await mockSak(page, [rolleBM, rolleBP, rolleBA]);
        const component = await mount(SAKSROLLER);
        await component.getByRole("button", { name: "Legg til nytt barn" }).click();
        await sammenlign(page.getByRole("dialog", { name: "Legg til nytt barn i saken" }), "legg-til-barn-modal");
    });

    test("ektefellebidrag", async ({ mount, page }) => {
        await mockSak(page, [rolleBM, rolleBP]);
        const component = await mount(SAKSROLLER);
        await sammenlign(component, "ektefellebidrag");
    });

    for (const story of FORELDER_STORIES) {
        test(`forelder: ${story}`, async ({ mount }) => {
            const component = await mount(`routes/sak/saksroller/forelder-rolle/ForelderRolleVisning/${story}`);
            await sammenlign(component, `forelder-${story}`);
        });
    }

    for (const story of BARN_STORIES) {
        test(`barn: ${story}`, async ({ mount }) => {
            const component = await mount(`routes/sak/saksroller/barn-rolle/BarnVisning/${story}`);
            await sammenlign(component, `barn-${story}`);
        });
    }
});
