import type { ForelderBarnRelasjon, ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it, vi } from "vitest";

import { beregnBarnMedUfullstendigRelasjon } from "./useUfullstendigRelasjonSjekk.ts";

function lagRelasjon(foreldre: string[]): ForelderBarnRelasjonDto {
    return {
        forelderBarnRelasjon: foreldre.map(
            (ident): ForelderBarnRelasjon => ({
                minRolleForPerson: "BARN",
                relatertPersonsIdent: ident,
                relatertPersonsRolle: "FORELDER",
            }),
        ),
    };
}

describe("beregnBarnMedUfullstendigRelasjon", () => {
    const bidragsmottaker = "11111111111";
    const bidragspliktig = "22222222222";

    it("returnerer alle barn uendret hvis bidragsmottaker eller bidragspliktig mangler", async () => {
        const hentRelasjon = vi.fn();

        const resultat = await beregnBarnMedUfullstendigRelasjon(
            ["10987654321"],
            undefined,
            bidragspliktig,
            hentRelasjon,
        );

        expect(resultat).toEqual(["10987654321"]);
        expect(hentRelasjon).not.toHaveBeenCalled();
    });

    it("returnerer tomt array når barnet har relasjon til begge foreldrene", async () => {
        const hentRelasjon = vi.fn().mockResolvedValue(lagRelasjon([bidragsmottaker, bidragspliktig]));

        const resultat = await beregnBarnMedUfullstendigRelasjon(
            ["10987654321"],
            bidragsmottaker,
            bidragspliktig,
            hentRelasjon,
        );

        expect(resultat).toEqual([]);
    });

    it("inkluderer barnet når det mangler relasjon til en av foreldrene", async () => {
        const hentRelasjon = vi.fn().mockResolvedValue(lagRelasjon([bidragsmottaker]));

        const resultat = await beregnBarnMedUfullstendigRelasjon(
            ["10987654321"],
            bidragsmottaker,
            bidragspliktig,
            hentRelasjon,
        );

        expect(resultat).toEqual(["10987654321"]);
    });

    it("inkluderer barnet når det har færre enn to registrerte foreldre-relasjoner", async () => {
        const hentRelasjon = vi.fn().mockResolvedValue(lagRelasjon([]));

        const resultat = await beregnBarnMedUfullstendigRelasjon(
            ["10987654321"],
            bidragsmottaker,
            bidragspliktig,
            hentRelasjon,
        );

        expect(resultat).toEqual(["10987654321"]);
    });

    it("sjekker flere barn uavhengig av hverandre", async () => {
        const hentRelasjon = vi.fn().mockImplementation((ident: string) => {
            if (ident === "10987654321") {
                return Promise.resolve(lagRelasjon([bidragsmottaker, bidragspliktig]));
            }
            return Promise.resolve(lagRelasjon([bidragsmottaker]));
        });

        const resultat = await beregnBarnMedUfullstendigRelasjon(
            ["10987654321", "33333333333"],
            bidragsmottaker,
            bidragspliktig,
            hentRelasjon,
        );

        expect(resultat).toEqual(["33333333333"]);
    });
});
