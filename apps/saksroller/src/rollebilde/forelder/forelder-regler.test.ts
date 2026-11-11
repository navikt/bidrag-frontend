import type { PersonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";
import type { Rolle } from "../../felles/sakvisning-schema";
import { finnDuplikatForelderFeil } from "./forelder-regler";

const person: PersonDto = {
    ident: "11111111111",
    visningsnavn: "Test Person",
};

const rolle = (type: "BP" | "BM", fodselsnummer: string): Rolle => ({
    type,
    rolleType: type,
    fodselsnummer,
    objektnummer: "",
    mottagerErVerge: false,
});

describe("finnDuplikatForelderFeil", () => {
    it.each([
        {
            tilfelle: "samme person i begge foreldreroller",
            eksisterende: rolle("BP", person.ident),
            forventet:
                "Test Person (11111111111) er allerede registrert som bidragspliktig og kan ikke legges til på nytt.",
        },
        { tilfelle: "annen person i den andre rollen", eksisterende: rolle("BP", "22222222222"), forventet: null },
        { tilfelle: "samme person i rollen som erstattes", eksisterende: rolle("BM", person.ident), forventet: null },
    ])("$tilfelle", ({ eksisterende, forventet }) => {
        expect(finnDuplikatForelderFeil([eksisterende], "BM", person)).toBe(forventet);
    });
});
