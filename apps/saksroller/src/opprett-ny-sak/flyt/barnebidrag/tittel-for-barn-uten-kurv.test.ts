import { describe, expect, it } from "vitest";
import { tittelForBarnUtenKurv } from "./useBarnebidragFlyt";

const valgt = { ident: "12345678901", navn: "Valgt", erKjent: true };
const ikkeValgt = { ident: "", navn: "", erKjent: undefined };
const ukjent = { ident: "", navn: "", erKjent: false };

describe("tittelForBarnUtenKurv", () => {
    it("skiller mellom forelder som ikke er valgt og forelder som er ukjent", () => {
        expect(tittelForBarnUtenKurv(ikkeValgt, ikkeValgt)).toBe("Foreldre ikke valgt");
        expect(tittelForBarnUtenKurv(valgt, ikkeValgt)).toBe("Bidragsmottaker ikke valgt");
        expect(tittelForBarnUtenKurv(ikkeValgt, valgt)).toBe("Bidragspliktig ikke valgt");
        expect(tittelForBarnUtenKurv(valgt, ukjent)).toBe("Med ukjent bidragsmottaker");
        expect(tittelForBarnUtenKurv(ukjent, valgt)).toBe("Med ukjent bidragspliktig");
        expect(tittelForBarnUtenKurv(valgt, valgt)).toBe("Ikke registrert som felles barn");
    });
});
