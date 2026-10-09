import type { ForelderBarnRelasjon, ForelderBarnRelasjonDto } from "@bidrag/api/PersonApi";
import { describe, expect, it } from "vitest";

import { harUfullstendigRelasjon } from "./ufullstendig-relasjon.ts";

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

    it.each([
        { foreldre: [bidragsmottaker, bidragspliktig], forventet: false },
        { foreldre: [bidragsmottaker, "33333333333"], forventet: true },
        { foreldre: [bidragsmottaker], forventet: true },
        { foreldre: [], forventet: true },
    ])("$foreldre gir $forventet", ({ foreldre, forventet }) => {
        expect(harUfullstendigRelasjon(lagRelasjon(foreldre), bidragsmottaker, bidragspliktig)).toBe(forventet);
    });
});
