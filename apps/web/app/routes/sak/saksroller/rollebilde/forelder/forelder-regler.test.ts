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
    it("avviser samme person i begge foreldreroller", () => {
        expect(finnDuplikatForelderFeil([rolle("BP", person.ident)], "BM", person)).toBe(
            "Test Person (11111111111) er allerede registrert som bidragspliktig og kan ikke legges til på nytt.",
        );
    });

    it("tillater personen når den andre foreldrerollen har en annen ident", () => {
        expect(finnDuplikatForelderFeil([rolle("BP", "22222222222")], "BM", person)).toBeNull();
    });

    it("sammenligner ikke mot rollen som erstattes", () => {
        expect(finnDuplikatForelderFeil([rolle("BM", person.ident)], "BM", person)).toBeNull();
    });
});
