import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";
import type { Locator } from "@playwright/test";
import { testpersoner } from "../../../playwright/opprett-ny-sak/fixtures";
import {
    expectNoAxeViolations,
    mockOpprettSakApi,
    åpneSøskenflokker,
} from "../../../playwright/opprett-ny-sak/network";
import type { Innbygget } from "./OpprettSakFlyt.story";

const STORY = "opprett-ny-sak/start/OpprettSakFlyt/Standard";

test("sakstype og kategori er nedtrekkslister ved siden av hverandre", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    const component = await mount(STORY);
    const sakstype = component.getByRole("combobox", { name: "Velg sakstype" });
    const kategori = component.getByRole("combobox", { name: "Kategori" });
    await expect(component.getByRole("heading", { name: "Type sak" })).toHaveCount(0);
    await expect(sakstype).toHaveValue("BARNEBIDRAG");
    await expect(kategori).toHaveValue("Nasjonal");
    await expect(sakstype.getByRole("option")).toHaveText([
        "Barnebidrag",
        "Ektefellebidrag",
        "Oppfostringsbidrag",
        "Farskap",
    ]);
    await expect(kategori.getByRole("option")).toHaveText(["Nasjonal", "Utland"]);
    const sakstypeRamme = await sakstype.boundingBox();
    const kategoriRamme = await kategori.boundingBox();
    expect(sakstypeRamme).not.toBeNull();
    expect(kategoriRamme).not.toBeNull();
    expect(sakstypeRamme?.y).toBe(kategoriRamme?.y);
    expect(kategoriRamme?.x).toBeGreaterThan((sakstypeRamme?.x ?? 0) + (sakstypeRamme?.width ?? 0));
});

test("sakstype og kategori legges under hverandre på smale skjermer", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    await page.setViewportSize({ width: 375, height: 812 });
    const component = await mount(STORY);
    const sakstype = component.getByRole("combobox", { name: "Velg sakstype" });
    const kategori = component.getByRole("combobox", { name: "Kategori" });
    await expect(sakstype).toBeVisible();
    await expect(kategori).toBeVisible();
    const sakstypeRamme = await sakstype.boundingBox();
    const kategoriRamme = await kategori.boundingBox();
    expect(sakstypeRamme).not.toBeNull();
    expect(kategoriRamme).not.toBeNull();
    expect(sakstypeRamme?.x).toBe(kategoriRamme?.x);
    expect(kategoriRamme?.y).toBeGreaterThan((sakstypeRamme?.y ?? 0) + (sakstypeRamme?.height ?? 0));
});

async function velgStartpart(component: Locator, ident: string, rolle?: string) {
    const søk = component
        .getByRole("searchbox", {
            name:
                rolle === "Bidragspliktig"
                    ? "Søk etter bidragspliktig"
                    : rolle === "Bidragsmottaker"
                      ? "Søk etter bidragsmottaker"
                      : /^Søk etter/,
        })
        .first();
    await søk.fill(ident);
    await søk.press("Enter");
}

test("siden starter med BP- og BM-søk og Legg til nytt barn, uten startsøk eller rollevalg", async ({
    mount,
    page,
}) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);

    await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
    await expect(component.getByRole("button", { name: "Legg til nytt barn" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Søk opp person" })).toHaveCount(0);
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
    await expect(
        component
            .getByRole("group", { name: /^(Bidragsmottaker|Bidragspliktig)$/ })
            .evaluateAll((kort) => kort.map((element) => element.getAttribute("aria-label"))),
    ).resolves.toEqual(["Bidragsmottaker", "Bidragspliktig"]);
    await expectNoAxeViolations(page, component);
});

test("BP velges direkte i partskortet uten eget rollevalg", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);

    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Søk opp person" })).toHaveCount(0);
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
});

test("saken kan starte med barn og foreldrene velges fra BP- og BM-listene", async ({ mount, page }) => {
    const { bidragspliktig: bp, bidragsmottaker: bm, barnUnder18 } = testpersoner;
    const requests = await mockOpprettSakApi(page, { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } });
    const component = await mount(STORY);
    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søk.fill(barnUnder18.ident);
    await søk.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();

    const bpValg = component.getByRole("combobox", { name: "Velg bidragspliktig" });
    const bmValg = component.getByRole("combobox", { name: "Velg bidragsmottaker" });
    await expect(bpValg.getByRole("option", { name: bp.visningsnavn })).toHaveCount(1);
    await expect(bpValg.getByRole("option", { name: bm.visningsnavn })).toHaveCount(1);
    await expect(bmValg.getByRole("option", { name: bp.visningsnavn })).toHaveCount(1);
    await expect(bmValg.getByRole("option", { name: bm.visningsnavn })).toHaveCount(1);
    await bpValg.selectOption({ label: bp.visningsnavn });
    await expect(component.getByRole("group", { name: "Bidragsmottaker" }).getByText(bm.visningsnavn)).toBeVisible();
    await expect(component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` })).toBeChecked();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
    await component.getByRole("button", { name: /Opprett$/ }).click();
    await expect
        .poll(() => requests.create?.roller)
        .toEqual([
            expect.objectContaining({ fodselsnummer: bp.ident, type: "BP" }),
            expect.objectContaining({ fodselsnummer: bm.ident, type: "BM" }),
            expect.objectContaining({ fodselsnummer: barnUnder18.ident, type: "BA" }),
        ]);
});

test("farskap starter med BM-søk og barn uten eget startsøk", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("FARSKAP");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toHaveCount(0);
    await expect(component.getByRole("button", { name: "Legg til nytt barn" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
});

test("oppfostringsbidrag starter med BP-søk og barn uten eget startsøk", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("OPPFOSTRINGSBIDRAG");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toHaveCount(0);
    await expect(component.getByRole("button", { name: "Legg til nytt barn" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
});

test("valgt barn åpner gruppen uten valgte foreldre og gruppen kan lukkes manuelt", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søk.fill(testpersoner.barnUnder18.ident);
    await søk.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();
    const flokk = component
        .getByRole("region", { name: "Søskenflokker" })
        .getByRole("button", { name: "Foreldre ikke valgt", exact: true });
    await expect(flokk).toHaveAttribute("aria-expanded", "true");
    await expect(
        component.getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18.visningsnavn}` }),
    ).toBeChecked();
    await flokk.click();
    await expect(flokk).toHaveAttribute("aria-expanded", "false");
    await component.getByRole("combobox", { name: "Kategori" }).selectOption("Utland");
    await expect(flokk).toHaveAttribute("aria-expanded", "false");
});

test("bytte av sakstype spør før et barn lagt til uten foreldre fjernes", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søk.fill(testpersoner.barnUnder18.ident);
    await søk.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();
    await expect(component.getByText("1 valgt", { exact: true })).toBeVisible();
    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("FARSKAP");
    const dialog = page.getByRole("alertdialog", { name: "Er du sikker?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Avbryt" }).click();
    await expect(component.getByRole("combobox", { name: "Velg sakstype" })).toHaveValue("BARNEBIDRAG");
    await expect(component.getByText("1 valgt", { exact: true })).toBeVisible();
});

test("viser datakvalitetsfeil også når BP søkes opp direkte på siden", async ({ mount, page }) => {
    const { bidragspliktig: bp, bidragsmottaker: bm } = testpersoner;
    await mockOpprettSakApi(page);
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({
            json: {
                person: bp,
                personensMotpartBarnRelasjon: [
                    { forelderrolleMotpart: "MOR", motpart: bm, fellesBarn: [] },
                    { forelderrolleMotpart: "FAR", motpart: bm, fellesBarn: [] },
                ],
            },
        });
    });
    const component = await mount(STORY);
    await velgStartpart(component, bp.ident, "Bidragspliktig");
    await expect(component.getByText(/Samme motpart er registrert med flere forelderroller/)).toBeVisible();
    await expect(component.getByRole("button", { name: /Opprett$/ })).toHaveCount(0);
});

test("Ctrl+ø sladder navn i valg, personkort og barn", async ({ mount, page }) => {
    await mockOpprettSakApi(page, {
        parentRelations: {
            [testpersoner.barnUnder18.ident]: [testpersoner.bidragspliktig.ident, testpersoner.bidragsmottaker.ident],
        },
    });
    const component = await mount(STORY);
    const søk = component.getByRole("searchbox", { name: "Søk etter bidragspliktig" });
    await søk.fill(testpersoner.bidragspliktig.ident);
    await søk.press("Enter");

    const rollenavn = component.getByRole("group", { name: "Bidragspliktig" }).locator(".personnavn").first();
    await expect(rollenavn).toHaveText(testpersoner.bidragspliktig.visningsnavn);

    await page.evaluate(() =>
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ø", ctrlKey: true, bubbles: true })),
    );
    await expect(page.locator("body")).toHaveClass(/blur-sensitive-info/);
    await expect(rollenavn).toHaveCSS("filter", "blur(5px)");

    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const barnSøk = page.getByRole("searchbox", { name: "Søk etter barn" });
    await barnSøk.fill(testpersoner.barnUnder18.ident);
    await barnSøk.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();
    await åpneSøskenflokker(component);
    const partnavn = component
        .locator(".personnavn")
        .filter({ hasText: testpersoner.bidragspliktig.visningsnavn })
        .first();
    const motpartnavn = component.locator(".personnavn").filter({
        hasText: testpersoner.bidragsmottaker.visningsnavn,
    });
    const barnnavn = component.locator(".personnavn").filter({ hasText: testpersoner.barnUnder18.visningsnavn });

    await expect(partnavn).toHaveCSS("filter", "blur(5px)");
    await expect(partnavn).not.toHaveAttribute("title");
    await expect(motpartnavn.first()).toHaveCSS("filter", "blur(5px)");
    await expect(barnnavn.first()).toHaveCSS("filter", "blur(5px)");

    await page.evaluate(() =>
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ø", ctrlKey: true, bubbles: true })),
    );
    await expect(page.locator("body")).not.toHaveClass(/blur-sensitive-info/);
    await expect(partnavn).toHaveCSS("filter", "none");
    await expect(partnavn).toHaveAttribute("title", testpersoner.bidragspliktig.visningsnavn);
});

test("startpersonen kan endres i partskortet uten å vise startsøket igjen", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
    await bpKort.getByRole("button", { name: "Endre bidragspliktig" }).click();
    const søk = bpKort.getByRole("searchbox", { name: "Søk etter bidragspliktig" });
    await søk.fill(testpersoner.bidragsmottaker.ident);
    await søk.press("Enter");
    await expect(bpKort.getByText(testpersoner.bidragsmottaker.visningsnavn)).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
    await expect(component.getByRole("radiogroup", { name: /Hvilken rolle har/ })).toHaveCount(0);
});

test("bytte av sakstype spør før skjemaet nullstilles", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);
    const barnOverskrift = component.getByRole("heading", { name: "Velg barn saken gjelder for" });
    const dialog = page.getByRole("alertdialog", { name: "Er du sikker?" });

    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");
    await expect(barnOverskrift).toBeVisible();

    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("EKTEFELLEBIDRAG");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Avbryt" }).click();
    await expect(dialog).toBeHidden();
    await expect(component.getByRole("combobox", { name: "Velg sakstype" })).toHaveValue("BARNEBIDRAG");
    await expect(barnOverskrift).toBeVisible();

    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("EKTEFELLEBIDRAG");
    await dialog.getByRole("button", { name: "Ja, start på nytt" }).click();
    await expect(component.getByRole("combobox", { name: "Velg sakstype" })).toHaveValue("EKTEFELLEBIDRAG");
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragspliktig" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
    await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
    await expect(barnOverskrift).toHaveCount(0);
});

test("kategori velges sammen med sakstype uten å nullstille skjemaet", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);

    await expect(component.getByRole("combobox", { name: "Kategori" })).toHaveValue("Nasjonal");
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    await component.getByRole("combobox", { name: "Kategori" }).selectOption("Utland");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();
    await expect(component.getByRole("combobox", { name: "Kategori" })).toHaveCount(1);
});

test("valgt kategori brukes i skjemaet og i oppslaget av enhet", async ({ mount, page }) => {
    const requests = await mockOpprettSakApi(page);
    const component = await mount(STORY);

    await component.getByRole("combobox", { name: "Kategori" }).selectOption("Utland");
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    await expect(component.getByRole("combobox", { name: "Kategori" })).toHaveValue("Utland");
    await expect.poll(() => requests.unit.at(-1)?.sakskategori).toBe("U");
});

test("viser ikke oppsummering", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    const component = await mount(STORY);

    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    await expect(component.getByRole("heading", { name: "Velg barn saken gjelder for" })).toBeVisible();
    await expect(component.getByRole("heading", { name: "Oppsummering" })).toHaveCount(0);
});

test("byttet BM vises i kortet og bare siste BM sendes ved opprettelse", async ({ mount, page }) => {
    const requests = await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("EKTEFELLEBIDRAG");
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");
    await velgStartpart(component, testpersoner.bidragsmottaker.ident, "Bidragsmottaker");
    const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
    await expect(bmKort.getByText(testpersoner.bidragsmottaker.visningsnavn)).toBeVisible();
    await bmKort.getByRole("button", { name: "Endre bidragsmottaker" }).click();
    await velgStartpart(component, testpersoner.annenForelder.ident, "Bidragsmottaker");
    await expect(bmKort.getByText(testpersoner.annenForelder.visningsnavn)).toBeVisible();
    await expect(bmKort.getByText(testpersoner.bidragsmottaker.visningsnavn)).toHaveCount(0);
    await component.getByRole("button", { name: /Opprett$/ }).click();
    await expect
        .poll(() => requests.create?.roller)
        .toEqual([
            expect.objectContaining({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP" }),
            expect.objectContaining({ fodselsnummer: testpersoner.annenForelder.ident, type: "BM" }),
        ]);
});

test("barn som velges bort vises uavkrysset og sendes ikke ved opprettelse", async ({ mount, page }) => {
    const requests = await mockOpprettSakApi(page);
    const component = await mount(STORY);
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");
    await velgStartpart(component, testpersoner.bidragsmottaker.ident, "Bidragsmottaker");
    await component.getByRole("button", { name: "Legg til nytt barn" }).click();
    const søk = page.getByRole("searchbox", { name: "Søk etter barn" });
    await søk.fill(testpersoner.barnUnder18.ident);
    await søk.press("Enter");
    await component.getByRole("button", { name: "Legg til", exact: true }).click();
    const barn = component.getByRole("checkbox", { name: `Velg ${testpersoner.barnUnder18.visningsnavn}` });
    await expect(barn).toBeChecked();
    await barn.uncheck();
    await expect(barn).not.toBeChecked();
    await expect(component.getByText("0 valgt", { exact: true })).toBeVisible();
    await component.getByRole("button", { name: /Opprett$/ }).click();
    await expect
        .poll(() => requests.create?.roller)
        .toEqual([
            expect.objectContaining({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP" }),
            expect.objectContaining({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM" }),
        ]);
});

test("viser varsel når forslag til barn ikke kan hentes", async ({ mount, page }) => {
    await mockOpprettSakApi(page);
    await page.route(/\/proxy\/bidrag-person\/motpartbarnrelasjon$/, async (route) => {
        await route.fulfill({ status: 500, json: { error: "Unavailable" } });
    });
    const component = await mount(STORY);

    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("FARSKAP");
    await velgStartpart(component, testpersoner.bidragsmottaker.ident);

    await expect(component.getByText("Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.")).toBeVisible();
    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("BARNEBIDRAG");
    await page.getByRole("alertdialog").getByRole("button", { name: "Ja, start på nytt" }).click();
    await expect(component.getByText("Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.")).toHaveCount(
        0,
    );
});

test("viser info om nyeste fødselsnummer i kortet til motparten etter søket", async ({ mount, page }) => {
    const gammelIdent = "01010199999";
    await mockOpprettSakApi(page, { personOverrides: { [gammelIdent]: testpersoner.bidragsmottaker } });
    const component = await mount(STORY);

    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("EKTEFELLEBIDRAG");
    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    const motpartSøk = component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" });
    await motpartSøk.fill(gammelIdent);
    await motpartSøk.press("Enter");

    const bmKort = component.getByRole("group", { name: "Bidragsmottaker" });
    await expect(bmKort.getByRole("searchbox")).toHaveCount(0);
    const meldingstekst = `Bruker nyeste fødselsnummer ${testpersoner.bidragsmottaker.ident}`;
    await expect(bmKort.getByText(meldingstekst)).toBeVisible();

    await page.evaluate(() =>
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ø", ctrlKey: true, bubbles: true })),
    );
    const melding = bmKort.getByRole("status").filter({ hasText: meldingstekst });
    await expect(melding).toHaveCSS("filter", "none");
    await expect(melding).toContainText(`Søkte på ${gammelIdent}`);
    await expect(melding.locator(".personident")).toHaveCount(2);
    for (const ident of await melding.locator(".personident").all()) {
        await expect(ident).toHaveCSS("filter", "blur(5px)");
    }
});

test("hele siden: velger sakstype, søker part, fyller ut motpart og oppretter ektefellebidragssak", async ({
    mount,
    page,
}) => {
    const requests = await mockOpprettSakApi(page);
    const component = await mount(STORY);

    await expect(component.getByRole("combobox", { name: "Velg sakstype" })).toHaveValue("BARNEBIDRAG");
    await expectNoAxeViolations(page, component);

    const bpKort = component.getByRole("group", { name: "Bidragspliktig" });
    const søkefelt = bpKort.getByRole("searchbox", { name: "Søk etter bidragspliktig" });
    const personsøk = bpKort.getByRole("link", { name: "Åpne personsøk i nytt vindu" });
    const feltRamme = await søkefelt.boundingBox();
    const lenkeRamme = await personsøk.boundingBox();
    expect(feltRamme).not.toBeNull();
    expect(lenkeRamme).not.toBeNull();
    expect(feltRamme?.width).toBeLessThan(400);
    expect(lenkeRamme?.y).toBeGreaterThan((feltRamme?.y ?? 0) + (feltRamme?.height ?? 0));

    await component.getByRole("combobox", { name: "Velg sakstype" }).selectOption("EKTEFELLEBIDRAG");

    await velgStartpart(component, testpersoner.bidragspliktig.ident, "Bidragspliktig");

    const motpartSøk = component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" });
    await motpartSøk.fill(testpersoner.bidragsmottaker.ident);
    await motpartSøk.press("Enter");
    await expect(component.getByText(testpersoner.bidragsmottaker.visningsnavn).first()).toBeVisible();

    await expect(component.getByRole("button", { name: /Opprett$/ })).toBeEnabled();
    await expectNoAxeViolations(page, component);

    await page.evaluate(() => {
        (window as unknown as { __sammeDokument?: boolean }).__sammeDokument = true;
    });

    await component.getByRole("button", { name: /Opprett$/ }).click();

    await expect.poll(() => requests.create).toBeTruthy();
    expect(requests.create).toMatchObject({
        eierfogd: "4806",
        kategori: "N",
        arbeidsfordeling: "EFS",
        ansatt: false,
        inhabilitet: false,
        levdeAdskilt: false,
    });
    expect(requests.create?.roller).toEqual([
        expect.objectContaining({ fodselsnummer: testpersoner.bidragspliktig.ident, type: "BP" }),
        expect.objectContaining({ fodselsnummer: testpersoner.bidragsmottaker.ident, type: "BM" }),
    ]);
    await expect
        .poll(() => page.evaluate(() => (window as unknown as { __sammeDokument?: boolean }).__sammeDokument))
        .toBe(true);
    await expect(component.getByTestId("route-path")).toHaveValue("/sak/1234567/saksroller");
    await expect(component.getByRole("button", { name: "Opprett", exact: true })).toHaveCount(0);
});

test.describe("Innbygget med forhåndsutfylling", () => {
    const INNBYGGET = "opprett-ny-sak/start/OpprettSakFlyt/Innbygget";
    const { bidragspliktig: bp, bidragsmottaker: bm, barnUnder18 } = testpersoner;
    const rollevelger = (component: import("@playwright/test").Locator) =>
        component.getByRole("radiogroup", { name: /Hvilken rolle har/ });

    test("inngang med BP fyller ut skjemaet uten sakstype, søk eller mulighet til å endre personen", async ({
        mount,
        page,
    }) => {
        await mockOpprettSakApi(page);
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: bp.ident, rolle: "BP" });
        const bpKort = component.getByRole("group", { name: "Bidragspliktig" });

        await expect(bpKort.getByText(bp.visningsnavn).first()).toBeVisible();
        await expect(component.getByRole("combobox", { name: "Velg sakstype" })).toHaveCount(0);
        await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);
        await expect(bpKort.getByRole("button", { name: "Endre bidragspliktig" })).toHaveCount(0);
        await expect(component.getByRole("combobox", { name: "Kategori" })).toHaveValue("Nasjonal");
        await expect(component.getByRole("searchbox", { name: "Søk etter bidragsmottaker" })).toBeVisible();
        await expect(rollevelger(component)).toHaveCount(0);
        await expectNoAxeViolations(page, component);
    });

    test("barnet modalen åpnes for kan ikke velges bort", async ({ mount, page }) => {
        await mockOpprettSakApi(page, { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } });
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: barnUnder18.ident, rolle: "BA" });
        await expect(component.getByRole("region", { name: "Søskenflokker" })).toBeVisible();
        await åpneSøskenflokker(component);
        const barn = component.getByRole("checkbox", { name: `Velg ${barnUnder18.visningsnavn}` });

        await expect(barn).toBeChecked();
        await barn.click({ force: true });
        await expect(barn).toBeChecked();
    });

    test("inngang uten rolle lar saksbehandler velge rollen", async ({ mount, page }) => {
        await mockOpprettSakApi(page);
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: bp.ident });

        await expect(rollevelger(component)).toBeVisible();
        await expect(rollevelger(component).getByRole("radio", { checked: true })).toHaveCount(0);
        await expect(component.getByRole("searchbox", { name: "Søk etter person" })).toHaveCount(0);

        await rollevelger(component).getByRole("radio", { name: "Bidragsmottaker" }).click();
        await expect(
            component.getByRole("group", { name: "Bidragsmottaker" }).getByText(bp.visningsnavn).first(),
        ).toBeVisible();
        await expect(rollevelger(component)).toHaveCount(0);
    });

    test("Avbryt kaller onAvbryt", async ({ mount, page }) => {
        await mockOpprettSakApi(page, { parentRelations: { [barnUnder18.ident]: [bp.ident, bm.ident] } });
        const component = await mount<typeof Innbygget>(INNBYGGET, { ident: barnUnder18.ident, rolle: "BA" });

        await component.getByRole("button", { name: "Avbryt" }).click();
        await expect(component.getByTestId("avbrutt")).toHaveValue("true");
        await expect(component.getByTestId("opprettet-saksnummer")).toHaveValue("");
    });
});
