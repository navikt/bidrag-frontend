import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock: Record<string, string | undefined> = {
    NODE_ENV: "development",
    UNLEASH_SERVER_API_URL: undefined,
    UNLEASH_SERVER_API_TOKEN: undefined,
    UNLEASH_SERVER_API_ENV: undefined,
    UNLEASH_LOCAL_TOGGLES: undefined,
};

vi.mock("~/env.server.ts", () => ({
    get env() {
        return envMock;
    },
}));
vi.mock("~/server/logger/navLogger.ts", () => ({
    navLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("unleash.server uten konfigurasjon", () => {
    beforeEach(() => {
        vi.resetModules();
        envMock.NODE_ENV = "development";
        envMock.UNLEASH_LOCAL_TOGGLES = undefined;
    });

    it("gir av for alle flagg når Unleash ikke er konfigurert", async () => {
        const { isEnabled } = await import("./unleash.server.ts");
        await expect(isEnabled("et.flagg")).resolves.toBe(false);
    });

    it("gir disabled-variant når Unleash ikke er konfigurert", async () => {
        const { getVariant } = await import("./unleash.server.ts");
        await expect(getVariant("et.flagg")).resolves.toMatchObject({ name: "disabled", enabled: false });
    });

    it("gir tom toggle-liste når Unleash ikke er konfigurert", async () => {
        const { evaluerAlleToggles } = await import("./unleash.server.ts");
        await expect(evaluerAlleToggles()).resolves.toEqual([]);
    });
});

describe("lokale overstyringer (UNLEASH_LOCAL_TOGGLES)", () => {
    beforeEach(() => {
        vi.resetModules();
        envMock.NODE_ENV = "development";
        envMock.UNLEASH_LOCAL_TOGGLES = "flagg.paa=true,flagg.av=false,flagg.uten.verdi";
    });

    it("skrur flagg på og av uten token", async () => {
        const { isEnabled } = await import("./unleash.server.ts");
        await expect(isEnabled("flagg.paa")).resolves.toBe(true);
        await expect(isEnabled("flagg.av")).resolves.toBe(false);
        await expect(isEnabled("ukjent.flagg")).resolves.toBe(false);
    });

    it("tolker flagg uten verdi som på", async () => {
        const { isEnabled } = await import("./unleash.server.ts");
        await expect(isEnabled("flagg.uten.verdi")).resolves.toBe(true);
    });

    it("eksponerer påskrudde overstyringer til klienten", async () => {
        const { evaluerAlleToggles } = await import("./unleash.server.ts");
        const toggles = await evaluerAlleToggles();
        expect(toggles.map((t) => t.name)).toEqual(["flagg.paa", "flagg.uten.verdi"]);
    });

    it("ignoreres i produksjon", async () => {
        envMock.NODE_ENV = "production";
        const { isEnabled } = await import("./unleash.server.ts");
        await expect(isEnabled("flagg.paa")).resolves.toBe(false);
    });

    it("tåler at lista er skrevet over flere linjer", async () => {
        envMock.UNLEASH_LOCAL_TOGGLES = "\n    flagg.paa=true,\n\n    flagg.av=false,\n    flagg.uten.verdi\n";
        const { isEnabled } = await import("./unleash.server.ts");
        await expect(isEnabled("flagg.paa")).resolves.toBe(true);
        await expect(isEnabled("flagg.av")).resolves.toBe(false);
        await expect(isEnabled("flagg.uten.verdi")).resolves.toBe(true);
    });
});
