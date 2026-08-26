import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";

import { beregnSakForslag } from "./useSakForslag.tsx";

const MAKS_ALDER_BARN = 24;

function lagPerson(ident: string, alderÅr: number, overrides: Partial<PersonDto> = {}): PersonDto {
    const iDag = new Date();
    const fødselsdato = new Date(iDag.getFullYear() - alderÅr, iDag.getMonth(), iDag.getDate())
        .toISOString()
        .slice(0, 10);

    return { ident, visningsnavn: `Person ${ident}`, fødselsdato, ...overrides };
}

function lagRelasjon(motpartIdent: string, fellesBarn: PersonDto[]): MotpartBarnRelasjon {
    return {
        forelderrolleMotpart: "FORELDER",
        motpart: lagPerson(motpartIdent, 40),
        fellesBarn,
    };
}

describe("beregnSakForslag", () => {
    it("viser alle motparter og deres barn når ingen barn finnes i saken fra før", () => {
        const barn = lagPerson("10987654321", 10);
        const relasjon = lagRelasjon("33333333333", [barn]);

        const resultat = beregnSakForslag({
            motpartRelasjon: { personensMotpartBarnRelasjon: [relasjon] },
            barnListe: [],
            barnIdenter: [],
            ukjentForelder: true,
            andreForelderIdent: undefined,
        });

        expect(resultat.muligeAndreForeldre.map((p) => p.ident)).toEqual(["33333333333"]);
        expect(resultat.muligeBarnPerMotpart.get("33333333333")?.map((b) => b.ident)).toEqual(["10987654321"]);
    });

    it("filtrerer motparter til kun de som deler minst ett av barna i saken", () => {
        const barnISaken = "10987654321";
        const relasjonMedFellesBarn = lagRelasjon("33333333333", [lagPerson(barnISaken, 10)]);
        const relasjonUtenFellesBarn = lagRelasjon("44444444444", [lagPerson("99999999999", 10)]);

        const resultat = beregnSakForslag({
            motpartRelasjon: { personensMotpartBarnRelasjon: [relasjonMedFellesBarn, relasjonUtenFellesBarn] },
            barnListe: [{ fodselsnummer: barnISaken }],
            barnIdenter: [barnISaken],
            ukjentForelder: true,
            andreForelderIdent: undefined,
        });

        expect(resultat.muligeAndreForeldre.map((p) => p.ident)).toEqual(["33333333333"]);
    });

    it("ekskluderer barn som allerede er i saken fra søskenforslag", () => {
        const barnISaken = "10987654321";
        const søsken = lagPerson("55555555555", 8);
        const relasjon = lagRelasjon("33333333333", [lagPerson(barnISaken, 10), søsken]);

        const resultat = beregnSakForslag({
            motpartRelasjon: { personensMotpartBarnRelasjon: [relasjon] },
            barnListe: [{ fodselsnummer: barnISaken }],
            barnIdenter: [barnISaken],
            ukjentForelder: true,
            andreForelderIdent: undefined,
        });

        expect(resultat.muligeBarnPerMotpart.get("33333333333")?.map((b) => b.ident)).toEqual(["55555555555"]);
    });

    it("henter kun søsken med den andre kjente forelderen når begge foreldre er kjent", () => {
        const barnISaken = "10987654321";
        const søsken = lagPerson("55555555555", 8);
        const relasjon = lagRelasjon("22222222222", [lagPerson(barnISaken, 10), søsken]);

        const resultat = beregnSakForslag({
            motpartRelasjon: { personensMotpartBarnRelasjon: [relasjon] },
            barnListe: [{ fodselsnummer: barnISaken }],
            barnIdenter: [barnISaken],
            ukjentForelder: false,
            andreForelderIdent: "22222222222",
        });

        expect(resultat.muligeAndreForeldre).toEqual([]);
        expect(resultat.muligeBarnPerMotpart.get("22222222222")?.map((b) => b.ident)).toEqual(["55555555555"]);
    });

    it("filtrerer bort barn som er eldre enn maks alder", () => {
        const forGammelt = lagPerson("66666666666", MAKS_ALDER_BARN + 1);
        const relasjon = lagRelasjon("33333333333", [forGammelt]);

        const resultat = beregnSakForslag({
            motpartRelasjon: { personensMotpartBarnRelasjon: [relasjon] },
            barnListe: [],
            barnIdenter: [],
            ukjentForelder: true,
            andreForelderIdent: undefined,
        });

        expect(resultat.muligeBarnPerMotpart.has("33333333333")).toBe(false);
    });

    it("returnerer tomme resultater når det ikke finnes noen relasjoner", () => {
        const resultat = beregnSakForslag({
            motpartRelasjon: { personensMotpartBarnRelasjon: [] },
            barnListe: [],
            barnIdenter: [],
            ukjentForelder: true,
            andreForelderIdent: undefined,
        });

        expect(resultat.muligeAndreForeldre).toEqual([]);
        expect(resultat.muligeBarnPerMotpart.size).toBe(0);
    });
});
