import type { Henvendelser } from "@bidrag/api/BidragHenvendelseApi";
import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import type { Page } from "@playwright/test";

const STORY = "routes/bruker/henvendelser/HenvendelseTabell/Seksjon";

const henvendelser: Henvendelser = {
    henvendelser: [
        {
            kjedeId: "kjede-eldst",
            henvendelsestype: "SAMTALEREFERAT",
            tema: "BID",
            temagruppe: "FMLI",
            sisteMeldingSendt: "2026-01-23T10:00:00Z",
        },
        {
            kjedeId: "kjede-nyest",
            henvendelsestype: "MELDINGSKJEDE",
            tema: null,
            temagruppe: "FMLI",
            sisteMeldingSendt: "2026-06-28T09:30:00Z",
        },
    ],
    avkortet: false,
};

function kodeverk(kode: string, term: string) {
    return {
        betydninger: {
            [kode]: [{ gyldigFra: "1900-01-01", gyldigTil: "9999-12-31", beskrivelser: { nb: { term, tekst: term } } }],
        },
    };
}

async function mockKodeverk(page: Page) {
    await page.route(/\/proxy\/bidrag-kodeverk\/kodeverk\/Tema$/, (route) =>
        route.fulfill({ json: kodeverk("BID", "Bidrag") }),
    );
    await page.route(/\/proxy\/bidrag-kodeverk\/kodeverk\/Temagrupper$/, (route) =>
        route.fulfill({ json: kodeverk("FMLI", "Familie") }),
    );
}

async function mockHenvendelser(page: Page, svar: { status?: number; json?: unknown }) {
    await page.route(/\/proxy\/bidrag-henvendelse\/henvendelser$/, (route) =>
        route.fulfill({ status: svar.status ?? 200, json: svar.json }),
    );
}

test.describe("HenvendelseSeksjon", () => {
    test("viser henvendelsene med navn fra kodeverket, nyeste først", async ({ mount, page }) => {
        await mockKodeverk(page);
        await mockHenvendelser(page, { json: henvendelser });
        const component = await mount(STORY);

        await expect(component.getByRole("heading", { name: "Henvendelser" })).toBeVisible();
        await expect(component.getByLabel("2 henvendelser")).toBeVisible();

        const rader = component.getByRole("row");
        await expect(rader).toHaveCount(3);
        await expect(rader.nth(1)).toContainText("28.06.2026");
        await expect(rader.nth(1)).toContainText("Meldingskjede");
        await expect(rader.nth(2)).toContainText("Samtalereferat");
        await expect(rader.nth(2)).toContainText("Bidrag");
        await expect(component.getByText("Familie")).toHaveCount(2);
        await expect(rader.nth(1).getByRole("cell").nth(3)).toHaveText("-");
    });

    test("lenker hver rad til tråden i Modia", async ({ mount, page }) => {
        await mockKodeverk(page);
        await mockHenvendelser(page, { json: henvendelser });
        const component = await mount(STORY);

        const lenke = component.getByRole("row").nth(1).getByRole("link", { name: "Åpne henvendelsen i Modia" });
        await expect(lenke).toHaveAttribute("href", /^\/modia\/person\?sokFnr=\d{11}&henvendelseId=kjede-nyest$/);
        await expect(component.getByRole("link", { name: /^Modia/ })).toHaveAttribute(
            "href",
            /^\/modia\/person\?sokFnr=\d{11}$/,
        );
    });

    test("viser kodene når kodeverket feiler", async ({ mount, page }) => {
        await page.route(/\/proxy\/bidrag-kodeverk\//, (route) => route.fulfill({ status: 500, json: {} }));
        await mockHenvendelser(page, { json: henvendelser });
        const component = await mount(STORY);

        await expect(component.getByText("BID", { exact: true })).toBeVisible();
        await expect(component.getByText("FMLI", { exact: true })).toHaveCount(2);
    });

    test("viser melding når personen ikke har henvendelser", async ({ mount, page }) => {
        await mockKodeverk(page);
        await mockHenvendelser(page, { json: { henvendelser: [], avkortet: false } });
        const component = await mount(STORY);

        await expect(component.getByText("Det finnes ingen henvendelser for denne personen.")).toBeVisible();
        await expect(component.getByLabel("0 henvendelser")).toBeVisible();
    });

    test("varsler når lista er avkortet", async ({ mount, page }) => {
        await mockKodeverk(page);
        await mockHenvendelser(page, { json: { ...henvendelser, avkortet: true } });
        const component = await mount(STORY);

        await expect(
            component.getByText("Bruker har flere henvendelser enn vi viser her. Se alle i Modia."),
        ).toBeVisible();
    });

    test("viser feilmelding i seksjonen når henvendelsestjenesten feiler", async ({ mount, page }) => {
        await mockKodeverk(page);
        await mockHenvendelser(page, {
            status: 502,
            json: { status: 502, title: "Feil ved kall mot tjeneste", detail: "Tjenesten svarte med feil." },
        });
        const component = await mount(STORY);

        await expect(component.getByText("Kunne ikke hente henvendelser")).toBeVisible();
        await expect(component.getByText("Tjenesten svarte med feil.")).toBeVisible();
    });
});
