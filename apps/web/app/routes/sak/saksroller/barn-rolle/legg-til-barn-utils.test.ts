import { describe, expect, it } from "vitest";

import { finnValideringsfeilForBarn } from "./legg-til-barn-utils.ts";

describe("finnValideringsfeilForBarn", () => {
    it("avviser barn når alderen ikke kan beregnes", () => {
        expect(finnValideringsfeilForBarn({ ident: "ugyldig", visningsnavn: "Ukjent Alder" }, [])).toBe(
            "Kunne ikke beregne alder for barnet.",
        );
    });

    it("godtar barn med kjent alder under maksgrensen", () => {
        expect(
            finnValideringsfeilForBarn(
                { ident: "12041512345", visningsnavn: "Test Barn", fødselsdato: "2015-04-12" },
                [],
            ),
        ).toBeUndefined();
    });
});
