import { expect, type Locator, type Page, test } from "@playwright/test";

const STANDARD_STORY = "routes/sak/SakLayouts/StandardMedSidemeny";
const DOKUMENTER_STORY = "routes/sak/SakLayouts/DokumenterMedSidemeny";
const UTEN_FELLES_HEADER_STORY = "routes/sak/SakLayouts/UtenFellesHeader";
const UTEN_TILGANG_STORY = "routes/sak/SakLayouts/UtenTilgang";

async function mockSakHeaderKall(page: Page) {
    await page.route("**/proxy/**", async (route) => {
        throw new Error(`Uventet proxy-kall i layout-story: ${route.request().method()} ${route.request().url()}`);
    });
    await page.route("**/log/**", async (route) => {
        await route.fulfill({ status: 204 });
    });
}

async function målLayout(component: Locator) {
    return component.evaluate((root) => {
        const sidemeny = root.querySelector<HTMLElement>('nav[aria-label="Sakmeny"]');
        const sideinnhold = root.querySelector<HTMLElement>('[data-testid="sideinnhold"]');
        const innholdscontainer = sideinnhold?.parentElement;
        const sidemenyContainer = sidemeny?.parentElement;
        const layout = sidemenyContainer?.contains(sideinnhold) ? sidemenyContainer : sidemenyContainer?.parentElement;

        if (!sidemeny || !sideinnhold || !innholdscontainer || !layout) {
            throw new Error("Fant ikke alle layout-elementene");
        }

        const sideinnholdRect = sideinnhold.getBoundingClientRect();
        const sidemenyRect = sidemeny.getBoundingClientRect();
        const innholdscontainerRect = innholdscontainer.getBoundingClientRect();
        const layoutStyle = getComputedStyle(layout);
        const innholdscontainerStyle = getComputedStyle(innholdscontainer);

        return {
            toppavstand: Number.parseFloat(layoutStyle.marginTop),
            sideinnholdsbredde: sideinnholdRect.width,
            avstandFraSidemeny: sideinnholdRect.left - sidemenyRect.right,
            pageBlockBredde: innholdscontainerRect.width,
            kolonneavstand: Number.parseFloat(layoutStyle.columnGap),
            paddingVenstre: Number.parseFloat(innholdscontainerStyle.paddingLeft),
            paddingHøyre: Number.parseFloat(innholdscontainerStyle.paddingRight),
            sentrertPageBlock: Math.abs(innholdscontainerRect.left - (window.innerWidth - innholdscontainerRect.right)),
            ytrePageBlockBredde: innholdscontainerRect.width,
            sidemenyVenstre: sidemenyRect.left,
        };
    });
}

test.describe("sakslayouter", () => {
    test("standardlayout viser toppavstand, sidemeny og 2xl-bredde", async ({ mount, page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await mockSakHeaderKall(page);
        const component = await mount(STANDARD_STORY);
        const layout = await målLayout(component);

        await expect(component.getByText("Dokumenter", { exact: true })).toHaveCount(2);
        await expect(component.getByText("Kari Nordmann")).toBeVisible();
        await expect(component.getByText("Ola Nordmann")).toBeVisible();
        await expect(component.getByText("Lille Nordmann")).toBeVisible();
        await expect(component.getByRole("navigation", { name: "Sakmeny" })).toBeVisible();
        await expect(component.getByRole("heading", { name: "Standard sideinnhold" })).toBeVisible();
        expect(layout.toppavstand).toBe(32);
        expect(layout.kolonneavstand).toBe(32);
        expect(layout.ytrePageBlockBredde).toBeLessThanOrEqual(1440);
        expect(layout.ytrePageBlockBredde).toBeGreaterThan(1280);
        expect(layout.sentrertPageBlock).toBeLessThanOrEqual(1);
        expect(layout.sidemenyVenstre).toBe(0);
        expect(layout.avstandFraSidemeny).toBe(32);
        expect(layout.paddingVenstre).toBe(0);
        expect(layout.paddingHøyre).toBe(0);
    });

    test("standardlayout tilpasser sidemeny og innhold til smalt vindu", async ({ mount, page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await mockSakHeaderKall(page);
        const component = await mount(STANDARD_STORY);
        const layout = await målLayout(component);

        await expect(component.getByRole("navigation", { name: "Sakmeny" })).toBeVisible();
        await expect(component.getByRole("heading", { name: "Standard sideinnhold" })).toBeVisible();
        expect(layout.avstandFraSidemeny).toBe(32);
        expect(layout.sidemenyVenstre).toBe(16);
        expect(await component.evaluate((root) => root.scrollWidth)).toBeLessThanOrEqual(1024);
    });

    test("dokumentlayout viser toppavstand, sidemeny og full bredde uten gutters", async ({ mount, page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await mockSakHeaderKall(page);
        const component = await mount(DOKUMENTER_STORY);
        const layout = await målLayout(component);

        await expect(component.getByText("Dokumenter", { exact: true })).toHaveCount(2);
        await expect(component.getByRole("navigation", { name: "Sakmeny" })).toBeVisible();
        await expect(component.getByRole("heading", { name: "Dokumentvisning" })).toBeVisible();
        expect(layout.toppavstand).toBe(4);
        expect(layout.avstandFraSidemeny).toBe(0);
        expect(layout.pageBlockBredde).toBeGreaterThan(1440);
        expect(layout.paddingVenstre).toBe(0);
        expect(layout.paddingHøyre).toBe(0);
    });

    test("baselayout legger ikke styling rundt sider med egen header", async ({ mount, page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await mockSakHeaderKall(page);
        const component = await mount(UTEN_FELLES_HEADER_STORY);

        await expect(component.getByText("Dokumenter", { exact: true })).toHaveCount(0);
        await expect(component.getByRole("navigation", { name: "Sakmeny" })).toHaveCount(0);
        await expect(component.getByRole("heading", { name: "Side uten sidemeny" })).toBeVisible();
        await expect(component.locator(".aksel-pageblock")).toHaveCount(0);
    });

    test("henter ikke sak når saksbehandler mangler tilgang", async ({ mount, page }) => {
        await mockSakHeaderKall(page);
        const component = await mount(UTEN_TILGANG_STORY);

        await expect(component.getByText("Du har ikke tilgang til sak 2024-1234")).toBeVisible();
        await expect(component.getByText("Kari Nordmann")).toHaveCount(0);
    });
});
