import { expect, test } from "@bidrag/common/playwright/testing/ctTest.ts";

const STORY = "routes/sak/saksroller/felles/person-søk/PersonSøkWrapper/Standard";

test("vises inline, ikke som modal, og Avbryt lukker søket", async ({ mount }) => {
    const component = await mount(STORY);

    await expect(component.getByRole("heading", { name: "Legg til person" })).toBeVisible();
    await expect(component.getByRole("dialog")).toHaveCount(0);

    await component.getByRole("button", { name: "Avbryt" }).click();
    await expect(component.getByText("Søk avbrutt")).toBeVisible();
});
