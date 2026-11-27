import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRelasjonsregler } from "./useRelasjonsregler.ts";

const testState = vi.hoisted(() => ({
    annenForelderTillatt: false,
    bekreftede: new Set<string>(),
    bekreftelsekall: [] as string[][],
    bekreftelseEvalueringer: 0,
}));

vi.mock("@unleash/proxy-client-react", () => ({
    useFlag: vi.fn(() => testState.annenForelderTillatt),
}));

vi.mock("../bekreftelse/useBekreftelse.ts", () => ({
    useBekreftelse: vi.fn((identer: string[]) => {
        testState.bekreftelsekall.push([...identer]);
        return {
            bekreftetEllerVisFeil: () => {
                testState.bekreftelseEvalueringer += 1;
                return identer.every((ident) => testState.bekreftede.has(ident));
            },
        };
    }),
}));

function lagRegler(
    endringer: Partial<Parameters<typeof useRelasjonsregler>[0]> = {},
): ReturnType<typeof useRelasjonsregler> {
    return useRelasjonsregler({
        ufullstendige: [],
        annenForelder: [],
        oppslagsfeil: [],
        foreldre: ["bp", "bm"],
        ...endringer,
    });
}

describe("useRelasjonsregler", () => {
    beforeEach(() => {
        testState.annenForelderTillatt = false;
        testState.bekreftede.clear();
        testState.bekreftelsekall.length = 0;
        testState.bekreftelseEvalueringer = 0;
    });

    it("sperrer ved teknisk oppslagsfeil selv om alle bekreftelser er gitt", () => {
        testState.annenForelderTillatt = true;
        for (const ident of ["mangler|bp|bm", "annen|bp|bm", "skjult"]) {
            testState.bekreftede.add(ident);
        }
        const regler = lagRegler({
            ufullstendige: ["mangler"],
            annenForelder: ["annen"],
            oppslagsfeil: ["barn"],
            skjultForelder: ["skjult"],
        });

        expect(regler.harOppslagsfeil).toBe(true);
        expect(regler.harInnloggingsfeil).toBe(false);
        expect(regler.kanFortsette()).toBe(false);
        expect(testState.bekreftelseEvalueringer).toBe(3);
    });

    it("sperrer ved innloggingsfeil selv om relasjonsbekreftelsen er gitt", () => {
        testState.bekreftede.add("mangler|bp|bm");
        const regler = lagRegler({ ufullstendige: ["mangler"], innloggingsfeil: ["barn"] });

        expect(regler.harOppslagsfeil).toBe(false);
        expect(regler.harInnloggingsfeil).toBe(true);
        expect(regler.kanFortsette()).toBe(false);
        expect(testState.bekreftelseEvalueringer).toBe(3);
    });

    it("lar flyten fortsette uten feil eller nødvendige bekreftelser", () => {
        const regler = lagRegler();

        expect(regler.harOppslagsfeil).toBe(false);
        expect(regler.harInnloggingsfeil).toBe(false);
        expect(regler.kanFortsette()).toBe(true);
    });

    it("krever fortsatt bekreftelse for ufullstendig relasjon per barn og foreldre", () => {
        const regler = lagRegler({ ufullstendige: ["barn"] });

        expect(regler.kanFortsette()).toBe(false);
        expect(testState.bekreftelsekall[0]).toEqual(["barn|bp|bm"]);

        testState.bekreftede.add("barn|bp|bm");
        expect(regler.kanFortsette()).toBe(true);
    });

    it("beholder sperren for annen forelder og bekreftelsen når flagget tillater den", () => {
        const sperret = lagRegler({ annenForelder: ["barn"] });
        expect(sperret.annenForelderStopper).toBe(true);
        expect(sperret.kanFortsette()).toBe(false);

        testState.annenForelderTillatt = true;
        const bekreftelse = lagRegler({ annenForelder: ["barn"] });
        expect(bekreftelse.annenForelderStopper).toBe(false);
        expect(testState.bekreftelsekall).toContainEqual(["barn|bp|bm"]);
        expect(bekreftelse.kanFortsette()).toBe(false);

        testState.bekreftede.add("barn|bp|bm");
        expect(bekreftelse.kanFortsette()).toBe(true);
    });
});
