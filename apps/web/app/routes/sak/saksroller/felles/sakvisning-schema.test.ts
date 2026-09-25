import { describe, expect, it } from "vitest";
import type { SakRedigeringData } from "./sakvisning-schema.ts";
import { SakRedigeringSchema } from "./sakvisning-schema.ts";

function lagSak(overrides: Partial<SakRedigeringData["roller"][number]>[]): SakRedigeringData {
    return {
        saksnummer: "2300123",
        roller: overrides.map((rolle) => ({
            fodselsnummer: "10987654321",
            type: "BA",
            rolleType: "BA",
            objektnummer: "",
            mottagerErVerge: false,
            ...rolle,
        })),
    };
}

describe("SakRedigeringSchema", () => {
    it("godtar en gyldig sak med BM, BP og barn uten reell mottaker", () => {
        const sak = lagSak([
            { fodselsnummer: "11111111111", type: "BM", rolleType: "BM" },
            { fodselsnummer: "22222222222", type: "BP", rolleType: "BP" },
            { fodselsnummer: "10987654321", type: "BA", rolleType: "BA", erMyndig: false },
        ]);

        expect(SakRedigeringSchema.safeParse(sak).success).toBe(true);
    });

    it("krever reell mottaker for myndig barn selv om BM finnes", () => {
        const sak = lagSak([
            { fodselsnummer: "11111111111", type: "BM", rolleType: "BM" },
            { fodselsnummer: "10987654321", type: "BA", rolleType: "BA", erMyndig: true },
        ]);

        const resultat = SakRedigeringSchema.safeParse(sak);

        expect(resultat.success).toBe(false);
        expect(resultat.error?.issues[0]?.message).toBe("Reell mottaker må registreres for barn over 18 år");
    });

    it("godtar myndig barn når reell mottaker er satt", () => {
        const sak = lagSak([
            { fodselsnummer: "11111111111", type: "BM", rolleType: "BM" },
            {
                fodselsnummer: "10987654321",
                type: "BA",
                rolleType: "BA",
                erMyndig: true,
                reellMottaker: "10987654321",
                reellMottakerType: "barnet_selv",
            },
        ]);

        expect(SakRedigeringSchema.safeParse(sak).success).toBe(true);
    });

    it("krever reell mottaker for mindreårig barn når bidragsmottaker er ukjent", () => {
        const sak = lagSak([{ fodselsnummer: "10987654321", type: "BA", rolleType: "BA", erMyndig: false }]);

        const resultat = SakRedigeringSchema.safeParse(sak);

        expect(resultat.success).toBe(false);
        expect(resultat.error?.issues[0]?.message).toBe("Reell mottaker må registreres når bidragsmottaker er ukjent");
    });

    it("godtar mindreårig barn uten reell mottaker når bidragsmottaker er kjent", () => {
        const sak = lagSak([
            { fodselsnummer: "11111111111", type: "BM", rolleType: "BM" },
            { fodselsnummer: "10987654321", type: "BA", rolleType: "BA", erMyndig: false },
        ]);

        expect(SakRedigeringSchema.safeParse(sak).success).toBe(true);
    });

    it("teller ikke BM med tomt fødselsnummer som kjent bidragsmottaker", () => {
        const sak = lagSak([
            { fodselsnummer: "", type: "BM", rolleType: "BM" },
            { fodselsnummer: "10987654321", type: "BA", rolleType: "BA", erMyndig: false },
        ]);

        const resultat = SakRedigeringSchema.safeParse(sak);

        expect(resultat.success).toBe(false);
        expect(resultat.error?.issues[0]?.message).toBe("Reell mottaker må registreres når bidragsmottaker er ukjent");
    });
});
