import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        trace: vi.fn(),
        child: vi.fn(),
        level: "info",
        isLevelEnabled: vi.fn(() => true),
    },
    teamLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        trace: vi.fn(),
        child: vi.fn(),
        level: "info",
        isLevelEnabled: vi.fn(() => true),
    },
}));

vi.mock("@navikt/pino-logger", () => ({ logger: mocks.logger }));
vi.mock("@navikt/pino-logger/team-log", () => ({ teamLogger: mocks.teamLogger }));

import { kjørMedLoggerKontekst, settBrukerPåRequestKontekst } from "./loggerContext.ts";
import { navCombinedLogger, secureNavLogger } from "./navLogger.ts";

describe("navLogger", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.logger.isLevelEnabled.mockReturnValue(true);
        mocks.teamLogger.isLevelEnabled.mockReturnValue(true);
    });

    it("legger på correlationId og user uten at kallstedet oppgir dem", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345", user: "Z994321" }, () => {
            navCombinedLogger.info({ app: "bidrag-sak" }, "Hendelse");
        });

        expect(mocks.logger.info).toHaveBeenCalledWith(
            { correlationId: "ABCDE-12345", user: "Z994321", app: "bidrag-sak" },
            "Hendelse",
        );
    });

    it("logger til både vanlig logg og teamlogg", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navCombinedLogger.warn("Advarsel");
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
            navCombinedLogger.info({ correlationId: "FRA-PAYLOAD", user: undefined }, "Overstyrt");
        });

        expect(mocks.logger.info).toHaveBeenCalledWith({ correlationId: "FRA-PAYLOAD", user: undefined }, "Overstyrt");
    });

    it("beholder Error som err, slik at stacktracen serialiseres av pino", () => {
        const feil = new Error("Noe gikk galt");

        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navCombinedLogger.error(feil);
        });

        expect(mocks.logger.error).toHaveBeenCalledWith({ correlationId: "ABCDE-12345", err: feil });
    });

    it("sender rene meldinger videre urørt", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navCombinedLogger.info("Bare en melding");
        });

        expect(mocks.logger.info).toHaveBeenCalledWith("Bare en melding");
    });

    it("kaster ikke når det logges utenfor en request", () => {
        navCombinedLogger.info({ app: "bidrag-sak" }, "Ved oppstart");

        expect(mocks.logger.info).toHaveBeenCalledWith({ app: "bidrag-sak" }, "Ved oppstart");
    });

    it("tar med user som fylles inn etter at konteksten er åpnet", () => {
        kjørMedLoggerKontekst({ correlationId: "ABCDE-12345" }, () => {
            navCombinedLogger.info({ steg: "før" }, "Før auth");
            settBrukerPåRequestKontekst("Z994321");
            navCombinedLogger.info({ steg: "etter" }, "Etter auth");
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
                navCombinedLogger.info({ app: "bidrag-sak" }, "Parallelt");
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

describe("navLogger — maskering av fødselsnummer", () => {
    // Syntetisk fødselsnummer med gyldige kontrollsiffer.
    const FNR = lagSyntetiskFnr();

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.logger.isLevelEnabled.mockReturnValue(true);
        mocks.teamLogger.isLevelEnabled.mockReturnValue(true);
    });

    it("maskerer fødselsnummer i meldingen, ikke bare i objektet", () => {
        // Den vanligste lekkasjeveien: fnr interpolert rett inn i meldingen.
        navCombinedLogger.error(`Fant ikke person ${FNR}`);

        const [obj, melding] = mocks.logger.error.mock.calls[0] ?? [];
        expect(String(melding)).not.toContain(FNR);
        expect(obj).toMatchObject({ maskert_fnr: 1 });
    });

    it("maskerer fødselsnummer i både objekt og melding", () => {
        navCombinedLogger.warn({ app: "bidrag-sak" }, `Ident ${FNR}`);

        const [obj, melding] = mocks.logger.warn.mock.calls[0] ?? [];
        expect(String(melding)).not.toContain(FNR);
        expect(obj).toMatchObject({ app: "bidrag-sak", maskert_fnr: 1 });
    });

    it("maskerer fødselsnummer i en sti, der nøkkelen ikke er sensitiv", () => {
        // Proxyen logger `path: subPath`, og backend-stier kan inneholde fnr.
        navCombinedLogger.warn({ app: "bidrag-sak", path: `/person/${FNR}` }, "Proxy-kall fullført");

        const [obj] = mocks.logger.warn.mock.calls[0] ?? [];
        expect(JSON.stringify(obj)).not.toContain(FNR);
    });

    it("maskerer også kopien som havner i teamloggen", () => {
        navCombinedLogger.error({ path: `/person/${FNR}` }, "Feil");

        expect(JSON.stringify(mocks.teamLogger.error.mock.calls[0])).not.toContain(FNR);
    });

    it("legger ikke på maskert_fnr når ingenting ble maskert", () => {
        navCombinedLogger.info({ app: "bidrag-sak" }, "Alt i orden");

        expect(mocks.logger.info).toHaveBeenCalledWith({ app: "bidrag-sak" }, "Alt i orden");
    });

    it("maskerer ikke i securelog", () => {
        // Teamloggen er det sanksjonerte stedet for sensitive data.
        secureNavLogger.error({ ident: FNR }, "Feilet");

        expect(JSON.stringify(mocks.teamLogger.error.mock.calls[0])).toContain(FNR);
    });

    it("viderefører maskeringsinnstillingen til child-loggere", () => {
        mocks.teamLogger.child.mockReturnValue(mocks.teamLogger);

        secureNavLogger.child({ app: "bidrag-sak" }).error({ ident: FNR }, "Feilet");

        expect(JSON.stringify(mocks.teamLogger.error.mock.calls[0])).toContain(FNR);
    });

    it("hopper over maskering når nivået er slått av", () => {
        // Proxyen kaller trace på hvert eneste kall, og trace er av i prod.
        mocks.logger.isLevelEnabled.mockReturnValue(false);
        mocks.teamLogger.isLevelEnabled.mockReturnValue(false);

        navCombinedLogger.trace({ path: `/person/${FNR}` }, "Proxy-kall fullført");

        expect(mocks.logger.trace).not.toHaveBeenCalled();
    });
});

/** Genererer et syntetisk fødselsnummer, slik at ingen ekte identer ligger i repoet. */
function lagSyntetiskFnr(): string {
    const vekterK1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
    const vekterK2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const siffer = (sifre: number[], vekter: number[]) => {
        const rest = vekter.reduce((akk, vekt, i) => akk + vekt * (sifre[i] ?? 0), 0) % 11;
        if (rest === 0) return 0;
        return 11 - rest === 10 ? null : 11 - rest;
    };

    for (let individ = 0; individ < 1000; individ++) {
        const base = [...`150685${String(individ).padStart(3, "0")}`].map(Number);
        const k1 = siffer(base, vekterK1);
        if (k1 === null) continue;
        const k2 = siffer([...base, k1], vekterK2);
        if (k2 === null) continue;
        return [...base, k1, k2].join("");
    }
    throw new Error("Klarte ikke lage syntetisk fnr");
}
