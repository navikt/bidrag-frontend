import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn(), level: "info" },
    teamLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn(), level: "info" },
}));

vi.mock("@navikt/pino-logger", () => ({ logger: mocks.logger }));
vi.mock("@navikt/pino-logger/team-log", () => ({ teamLogger: mocks.teamLogger }));

import { kjørMedLoggerKontekst, settBrukerPåRequestKontekst } from "./loggerContext.ts";
import { navLogger, secureNavLogger } from "./navLogger.ts";

describe("navLogger", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("legger på correlationId og user uten at kallstedet oppgir dem", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345", user: "Z994321" }, () => {
            navLogger.info({ app: "bidrag-sak" }, "Hendelse");
        });

        expect(mocks.logger.info).toHaveBeenCalledWith(
            { correlationId: "ABCDE-12345", user: "Z994321", app: "bidrag-sak" },
            "Hendelse",
        );
    });

    it("logger til både vanlig logg og teamlogg", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navLogger.warn("Advarsel");
        });

        expect(mocks.logger.warn).toHaveBeenCalledWith("Advarsel");
        expect(mocks.teamLogger.warn).toHaveBeenCalledWith("Advarsel");
    });

    it("gir også securelog ambient felter", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345", user: "Z994321" }, () => {
            secureNavLogger.error({ audience: "api://backend" }, "Tokenfeil");
        });

        expect(mocks.teamLogger.error).toHaveBeenCalledWith(
            { correlationId: "ABCDE-12345", user: "Z994321", audience: "api://backend" },
            "Tokenfeil",
        );
        expect(mocks.logger.error).not.toHaveBeenCalled();
    });

    it("lar eksplisitte felter overstyre ambient kontekst", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345", user: "Z994321" }, () => {
            navLogger.info({ correlationId: "FRA-PAYLOAD", user: undefined }, "Overstyrt");
        });

        expect(mocks.logger.info).toHaveBeenCalledWith({ correlationId: "FRA-PAYLOAD", user: undefined }, "Overstyrt");
    });

    it("beholder Error som err, slik at stacktracen serialiseres av pino", () => {
        const feil = new Error("Noe gikk galt");

        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navLogger.error(feil);
        });

        expect(mocks.logger.error).toHaveBeenCalledWith({ correlationId: "ABCDE-12345", err: feil });
    });

    it("sender rene meldinger videre urørt", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navLogger.info("Bare en melding");
        });

        expect(mocks.logger.info).toHaveBeenCalledWith("Bare en melding");
    });

    it("kaster ikke når det logges utenfor en request", () => {
        navLogger.info({ app: "bidrag-sak" }, "Ved oppstart");

        expect(mocks.logger.info).toHaveBeenCalledWith({ app: "bidrag-sak" }, "Ved oppstart");
    });

    it("tar med user som fylles inn etter at konteksten er åpnet", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navLogger.info({ steg: "før" }, "Før auth");
            settBrukerPåRequestKontekst("Z994321");
            navLogger.info({ steg: "etter" }, "Etter auth");
        });

        expect(mocks.logger.info).toHaveBeenNthCalledWith(1, { correlationId: "ABCDE-12345", steg: "før" }, "Før auth");
        expect(mocks.logger.info).toHaveBeenNthCalledWith(
            2,
            { correlationId: "ABCDE-12345", user: "Z994321", steg: "etter" },
            "Etter auth",
        );
    });

    it("lekker ikke kontekst mellom parallelle requester", async () => {
        const loggEtterVent = (correlationId: string, ventetid: number) =>
            kjørMedLoggerKontekst({ correlationId }, async () => {
                await new Promise((resolve) => setTimeout(resolve, ventetid));
                navLogger.info({ app: "bidrag-sak" }, "Parallelt");
            });

        await Promise.all([loggEtterVent("FØRST-00001", 10), loggEtterVent("ANDRE-00002", 1)]);

        expect(mocks.logger.info).toHaveBeenNthCalledWith(
            1,
            { correlationId: "ANDRE-00002", app: "bidrag-sak" },
            "Parallelt",
        );
        expect(mocks.logger.info).toHaveBeenNthCalledWith(
            2,
            { correlationId: "FØRST-00001", app: "bidrag-sak" },
            "Parallelt",
        );
    });
});
