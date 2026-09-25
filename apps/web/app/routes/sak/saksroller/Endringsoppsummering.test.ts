import { describe, expect, it } from "vitest";

import { lagEndringsoppsummering } from "./endringsoppsummering-utils.ts";
import type { BarnRolle, Rolle } from "./sakvisning-schema.ts";

function lagForelder(overrides: Partial<Rolle> = {}): Rolle {
    return {
        fodselsnummer: "12345678901",
        type: "BM",
        rolleType: "BM",
        objektnummer: "",
        mottagerErVerge: false,
        ...overrides,
    };
}

function lagBarn(overrides: Partial<BarnRolle> = {}): BarnRolle {
    return {
        fodselsnummer: "10987654321",
        type: "BA",
        rolleType: "BA",
        objektnummer: "",
        mottagerErVerge: false,
        ...overrides,
    };
}

describe("lagEndringsoppsummering – advarsel om ufullstendig relasjon", () => {
    it("merker en endringsrad med harUfullstendigRelasjon=true når barnets ident er i listen", () => {
        const opprinnelige = [lagBarn({ reellMottaker: undefined })];
        const nåværende = [lagBarn({ reellMottaker: "12345678901", reellMottakerType: "barnet_selv" })];

        const [endring] = lagEndringsoppsummering(opprinnelige, nåværende, ["10987654321"]);

        expect(endring?.harUfullstendigRelasjon).toBe(true);
    });

    it("setter harUfullstendigRelasjon=false når barnets ident ikke er i listen", () => {
        const opprinnelige = [lagBarn({ reellMottaker: undefined })];
        const nåværende = [lagBarn({ reellMottaker: "12345678901", reellMottakerType: "barnet_selv" })];

        const [endring] = lagEndringsoppsummering(opprinnelige, nåværende, ["99999999999"]);

        expect(endring?.harUfullstendigRelasjon).toBe(false);
    });

    it("setter harUfullstendigRelasjon=false som standard når parameteren utelates", () => {
        const opprinnelige = [lagForelder()];
        const nåværende = [lagForelder(), lagBarn()];

        const [endring] = lagEndringsoppsummering(opprinnelige, nåværende);

        expect(endring?.harUfullstendigRelasjon).toBe(false);
    });
});
