import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, type Locator, test } from "@playwright/test";
import { environment } from "../config/environment.ts";

const authDirectory = resolve(import.meta.dirname, "../../.auth");
const storageStatePath = resolve(authDirectory, "user.json");

async function isVisible(locator: Locator) {
    return locator.isVisible({ timeout: 2_000 }).catch(() => false);
}

test("logger inn testbrukeren", async ({ page }) => {
    await page.goto("/admin");

    if (new URL(page.url()).origin !== new URL(environment.baseUrl).origin) {
        const username = page
            .getByLabel(/brukernavn|navident|e-post|email/i)
            .or(page.getByRole("textbox"))
            .first();
        await username.fill(environment.username);

        const continueButton = page.getByRole("button", { name: /neste|next|fortsett|logg inn|sign in/i }).first();
        if (await isVisible(continueButton)) {
            await continueButton.click();
        }

        const password = page.getByLabel(/passord|password/i).first();
        await password.waitFor({ state: "visible" });
        await password.fill(environment.password);
        await page
            .getByRole("button", { name: /logg inn|sign in|fortsett/i })
            .first()
            .click();

        const staySignedInButton = page.getByRole("button", { name: /nei|no/i }).first();
        if (await isVisible(staySignedInButton)) {
            await staySignedInButton.click();
        }
    }

    await expect(page).toHaveURL(new RegExp(`^${escapeRegExp(environment.baseUrl)}/admin`), { timeout: 30_000 });
    await mkdir(authDirectory, { recursive: true });
    await page.context().storageState({ path: storageStatePath });
    await page.reload();
});

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
