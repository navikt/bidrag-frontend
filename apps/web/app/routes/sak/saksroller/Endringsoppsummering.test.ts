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
    it.each([
        { ufullstendige: ["10987654321"], forventet: true },
        { ufullstendige: ["99999999999"], forventet: false },
    ])("barn i listen $ufullstendige gir harUfullstendigRelasjon=$forventet", ({ ufullstendige, forventet }) => {
        const opprinnelige = [lagBarn({ reellMottaker: undefined })];
        const nåværende = [lagBarn({ reellMottaker: "12345678901", reellMottakerType: "barnet_selv" })];

        const [endring] = lagEndringsoppsummering(opprinnelige, nåværende, ufullstendige);

        expect(endring?.harUfullstendigRelasjon).toBe(forventet);
    });

    it("setter harUfullstendigRelasjon=false som standard når parameteren utelates", () => {
        const opprinnelige = [lagForelder()];
        const nåværende = [lagForelder(), lagBarn()];

        const [endring] = lagEndringsoppsummering(opprinnelige, nåværende);

        expect(endring?.harUfullstendigRelasjon).toBe(false);
    });
});
