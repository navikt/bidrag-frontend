import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";

const STORY = "routes/sak/dokumenter/components/SaksdokumentTabell/TabellMedVedlegg";

test.describe("SaksdokumentTabell", () => {
    test("viser samme Dok.dato som Journalen for et dokument som er skannet senere", async ({ mount }) => {
        const component = await mount(STORY);

        const kolonner = await component.getByRole("columnheader").allTextContents();
        const dokDatoKolonne = kolonner.findIndex((tekst) => tekst.includes("Dok.dato"));
        expect(dokDatoKolonne).toBeGreaterThanOrEqual(0);

        const søknad = component.getByRole("row").filter({ hasText: "Søknad om barnebidrag" });
        await expect(søknad.getByRole("cell").nth(dokDatoKolonne)).toHaveText("06.01.2025");
    });
});
