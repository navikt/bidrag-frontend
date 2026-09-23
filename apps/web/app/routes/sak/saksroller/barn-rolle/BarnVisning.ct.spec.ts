import { expect, test } from "@playwright/test";

const STORY_UTEN_RM = "routes/sak/saksroller/barn-rolle/BarnVisning/UtenReellMottaker";
const STORY_MED_RM_BARNET_SELV = "routes/sak/saksroller/barn-rolle/BarnVisning/MedReellMottakerBarnetSelv";
const STORY_NYTT_BARN = "routes/sak/saksroller/barn-rolle/BarnVisning/NyttBarnKanFjernes";
const STORY_PÅKREVD_RM = "routes/sak/saksroller/barn-rolle/BarnVisning/PåkrevdReellMottaker";

test.describe("BarnVisning", () => {
    test("viser 'Legg til reell mottaker' når barnet ikke har reell mottaker registrert", async ({ mount }) => {
        const component = await mount(STORY_UTEN_RM);

        await expect(component.getByRole("button", { name: "Legg til reell mottaker" })).toBeVisible();

        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();

        await expect(component.getByRole("dialog", { name: "Endre reell mottaker" })).toBeVisible();
        await expect(component.getByRole("radiogroup", { name: "Hvem er reell mottaker?" })).toBeVisible();
    });

    test("viser 'Barnet selv' som reell mottaker og kan endres via Endre-knappen", async ({ mount }) => {
        const component = await mount(STORY_MED_RM_BARNET_SELV);

        await expect(component.getByText("Barnet selv")).toBeVisible();
        await expect(component.getByRole("button", { name: "Endre reell mottaker" })).toBeVisible();
    });

    test("fjerner kun det nye barnet via Fjern-knappen, uten å påvirke andre barn", async ({ mount }) => {
        const component = await mount(STORY_NYTT_BARN);

        await expect(component.getByText("Nytt Barn", { exact: true })).toBeVisible();
        await expect(component.getByText("Eksisterende Barn")).toBeVisible();
        await expect(component.getByText("Nytt barn", { exact: true })).toBeVisible();

        await component.getByRole("button", { name: "Fjern" }).click();

        await expect(component.getByText("Nytt Barn", { exact: true })).toHaveCount(0);
        await expect(component.getByText("Eksisterende Barn")).toBeVisible();
    });

    test("reell mottaker er påkrevd og 'Bidragsmottaker' er deaktivert når den ikke kan fjernes", async ({ mount }) => {
        const component = await mount(STORY_PÅKREVD_RM);

        await component.getByRole("button", { name: "Legg til reell mottaker" }).click();

        await expect(component.getByRole("radio", { name: "Bidragsmottaker" })).toBeDisabled();
    });
});
