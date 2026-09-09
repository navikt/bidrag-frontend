import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    navLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    secureNavLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    env: { NODE_ENV: "production" },
}));

vi.mock("./navLogger", () => ({ navLogger: mocks.navLogger, secureNavLogger: mocks.secureNavLogger }));
vi.mock("~/env.server.ts", () => ({ env: mocks.env }));

import { action } from "./logRoute.ts";

function kall(body: unknown, type?: string) {
    return action({
        params: { type },
        request: new Request("http://localhost/log", { method: "POST", body: JSON.stringify(body) }),
        context: {} as never,
    } as never) as Promise<Response>;
}

describe("logRoute", () => {
    function sisteKall(mock: { mock: { calls: unknown[][] } }): [Record<string, unknown>, string] {
        const kall = mock.mock.calls.at(-1);
        if (!kall) {
            throw new Error("Forventet at loggeren ble kalt");
        }
        return kall as [Record<string, unknown>, string];
    }

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.env.NODE_ENV = "production";
    });

    it("sender hvert nivå til riktig pino-metode", async () => {
        await kall({ level: "warn", message: "Advarsel" });
        expect(mocks.navLogger.warn).toHaveBeenCalledWith({}, "Advarsel");
    });

    it("svarer 204 uten innhold", async () => {
        const res = await kall({ level: "info", message: "Hendelse" });
        expect(res.status).toBe(204);
    });

    it("ruter secure-logg til teamloggeren", async () => {
        await kall({ level: "info", message: "Hemmelig" }, "secure");
        expect(mocks.secureNavLogger.info).toHaveBeenCalled();
        expect(mocks.navLogger.info).not.toHaveBeenCalled();
    });

    it("avviser ugyldig payload med 400 uten å logge innholdet", async () => {
        const res = await kall({ level: "katastrofe", message: "x", hemmelig: "12345678901" });

        expect(res.status).toBe(400);
        expect(mocks.navLogger.error).not.toHaveBeenCalled();
        const loggetTekst = JSON.stringify(mocks.navLogger.warn.mock.calls);
        expect(loggetTekst).not.toContain("12345678901");
    });

    it("avviser context med objektverdi", async () => {
        const res = await kall({
            level: "info",
            message: "Hendelse",
            context: { bruker: { fnr: "12345678901" } },
        });
        expect(res.status).toBe(400);
    });

    it("legger feilen på err slik pino forventer, uten stack", async () => {
        await kall({
            level: "error",
            message: "Det feilet",
            error: { name: "TypeError", message: "x er undefined", stack: "at fn (app.js:1:2)" },
        });

        const [felter, melding] = sisteKall(mocks.navLogger.error);
        const err = felter.err as Record<string, unknown>;
        expect(melding).toBe("Det feilet");
        expect(err.name).toBe("TypeError");
        // Stacktracer fra nettleseren symbolikeres ikke lenger server-side — det eies
        // av Faro. Rå, minifisert `stack` skal derfor ikke havne i Loki.
        expect(err.stack).toBeUndefined();
        expect(felter.stack_symbolicated).toBeUndefined();
    });

    it("beholder componentStack (annet format enn stack, uavhengig av symbolikering)", async () => {
        await kall({
            level: "error",
            message: "React-feil",
            error: {
                name: "ReactException",
                message: "React-feil",
                stack: "at fn (app.js:1:2)",
                componentStack: "    at BeløpshistorikkTabell",
            },
        });

        const [felter] = sisteKall(mocks.navLogger.error);
        expect((felter.err as Record<string, unknown>).componentStack).toBe("    at BeløpshistorikkTabell");
        expect((felter.err as Record<string, unknown>).stack).toBeUndefined();
    });

    it("logger tilbakemelding uten NAV-ident", async () => {
        await kall({ level: "info", message: "Tilbakemelding", context: { kind: "feedback" } });
        const [felter] = sisteKall(mocks.navLogger.info);
        expect(felter.user).toBeUndefined();
    });
});
