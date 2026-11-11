import type { BidragOppgaveDto } from "@bidrag/api/BidragOppgaveApi";
import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import type { Page } from "@playwright/test";

const BASE_STORY = "common/oppgave/OppgaveSeksjon";
const STORY_PÅ = `${BASE_STORY}/FlaggPå`;
const STORY_AV = `${BASE_STORY}/FlaggAv`;

const OPPGAVER_URL = /\/proxy\/bidrag-oppgave\/api\/oppgaver$/;

function oppgave(overstyr: Partial<BidragOppgaveDto> = {}): BidragOppgaveDto {
    return {
        id: 101,
        status: "OPPRETTET",
        tema: "BID",
        oppgavetype: "JFR",
        tildeltEnhetsnr: "4806",
        prioritet: "NORM",
        saksreferanse: "2400001",
        fristFerdigstillelse: "2026-08-22",
        beskrivelseListe: [],
        ...overstyr,
    };
}

async function mockOppgaver(page: Page, svar: { status?: number; json: unknown }) {
    let antallKall = 0;
    await page.route(OPPGAVER_URL, (route) => {
        antallKall++;
        return route.fulfill({ status: svar.status ?? 200, json: svar.json });
    });
    return () => antallKall;
}

test.describe("OppgaveSeksjon", () => {
    test("viser oppgavene når flagget er på", async ({ mount, page }) => {
        await mockOppgaver(page, {
            json: [oppgave(), oppgave({ id: 102, oppgavetype: "VUR_HENV", tilordnetRessurs: "Z993784" })],
        });
        const component = await mount(STORY_PÅ);

        await expect(component.getByRole("row")).toHaveCount(3);
        await expect(component.getByText("VUR_HENV")).toBeVisible();
        await expect(component.getByText("Z993784")).toBeVisible();
        await expect(component.getByRole("link", { name: "2400001" }).first()).toHaveAttribute("href", "/sak/2400001");
    });

    test("kaller ikke oppgave-API-et når flagget er av", async ({ mount, page }) => {
        const antallKall = await mockOppgaver(page, { json: [oppgave()] });
        const component = await mount(STORY_AV);

        await expect(component.getByText("Oppgaver er foreløpig ikke tilgjengelig for deg")).toBeVisible();
        expect(antallKall()).toBe(0);
    });

    test("viser strek for bruker når oppgaven mangler brukerIdent, og lenke når den finnes", async ({
        mount,
        page,
    }) => {
        await mockOppgaver(page, { json: [oppgave(), oppgave({ id: 102, brukerIdent: genererFnr() })] });
        const component = await mount(STORY_PÅ);

        const rader = component.getByRole("row");
        await expect(rader.nth(1).getByRole("cell").last()).toHaveText("-");
        await expect(rader.nth(2).getByRole("cell").last().getByRole("link")).toHaveAttribute("href", /^\/bruker\//);
    });

    test("viser beskrivelseshistorikken som en liste", async ({ mount, page }) => {
        await mockOppgaver(page, {
            json: [
                oppgave({
                    beskrivelseListe: [
                        {
                            tidspunkt: "2026-08-20T10:00:00",
                            saksbehandlerNavn: "Ola",
                            kommentar: "Første",
                            endringer: [],
                        },
                        {
                            tidspunkt: "2026-08-21T10:00:00",
                            saksbehandlerNavn: "Kari",
                            kommentar: "Andre",
                            endringer: [],
                        },
                    ],
                }),
            ],
        });
        const component = await mount(STORY_PÅ);

        await component.getByRole("button", { name: "Vis mer" }).click();
        await expect(component.getByRole("listitem")).toHaveCount(2);
    });

    test("viser feilmelding i seksjonen når oppgave-API-et feiler", async ({ mount, page }) => {
        await mockOppgaver(page, { status: 502, json: { status: 502, detail: "Oppgave-API-et svarte med feil." } });
        const component = await mount(STORY_PÅ);

        await expect(component.getByText("Kunne ikke hente oppgaver")).toBeVisible();
        await expect(component.getByText("Oppgave-API-et svarte med feil.")).toBeVisible();
    });

    test("viser melding når det ikke finnes oppgaver", async ({ mount, page }) => {
        await mockOppgaver(page, { json: [] });
        const component = await mount(STORY_PÅ);

        await expect(component.getByText("Ingen oppgaver")).toBeVisible();
    });
});
