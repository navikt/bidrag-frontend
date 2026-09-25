import type { ForelderBarnRelasjon, ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";

import { harUfullstendigRelasjon } from "./ufullstendig-relasjon-utils.ts";

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

describe("harUfullstendigRelasjon", () => {
    const bidragsmottaker = "11111111111";
    const bidragspliktig = "22222222222";

    it("er komplett når barnet har relasjon til begge foreldrene", () => {
        expect(
            harUfullstendigRelasjon(lagRelasjon([bidragsmottaker, bidragspliktig]), bidragsmottaker, bidragspliktig),
        ).toBe(false);
    });

    it("er ufullstendig når barnet mangler relasjon til en av foreldrene", () => {
        expect(
            harUfullstendigRelasjon(lagRelasjon([bidragsmottaker, "33333333333"]), bidragsmottaker, bidragspliktig),
        ).toBe(true);
    });

    it("er ufullstendig når barnet har færre enn to registrerte foreldre", () => {
        expect(harUfullstendigRelasjon(lagRelasjon([bidragsmottaker]), bidragsmottaker, bidragspliktig)).toBe(true);
        expect(harUfullstendigRelasjon(lagRelasjon([]), bidragsmottaker, bidragspliktig)).toBe(true);
    });
});
