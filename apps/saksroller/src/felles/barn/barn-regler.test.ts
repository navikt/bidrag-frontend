import { describe, expect, it } from "vitest";

import { validerNyttBarn } from "./barn-regler";

const barn = { ident: "12041512345", visningsnavn: "Test Barn", fødselsdato: "2015-04-12" };

describe("validerNyttBarn", () => {
    it("avviser barn når alderen ikke kan beregnes", () => {
        expect(validerNyttBarn({ ident: "ugyldig", visningsnavn: "Ukjent Alder" }, { identerISaken: [] })).toBe(
            "Kunne ikke beregne alder for barnet.",
        );
    });

    it("godtar barn med kjent alder under maksgrensen", () => {
        expect(validerNyttBarn(barn, { identerISaken: [] })).toBeUndefined();
    });

    it("avviser barn som allerede er i saken før barn som finnes i forslagene", () => {
        expect(validerNyttBarn(barn, { identerISaken: [barn.ident], identerIForslag: [barn.ident] })).toBe(
            "Test Barn (12041512345) er allerede lagt til i saken",
        );
        expect(validerNyttBarn(barn, { identerISaken: [], identerIForslag: [barn.ident] })).toMatch(
            /finnes allerede i listen over barn som kan legges til/,
        );
    });

    it("avviser barn over maksalder", () => {
        expect(validerNyttBarn({ ...barn, fødselsdato: "1990-01-01" }, { identerISaken: [] })).toMatch(
            /kan ikke legges til\. Maks alder er 24 år\.$/,
        );
    });
});
