import { describe, expect, it } from "vitest";

import { harEndringer, lagEndringsoppsummering } from "./Endringsoppsummering.tsx";
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

describe("harEndringer", () => {
    it("returnerer false når rollene er identiske", () => {
        const roller = [lagForelder(), lagBarn()];

        expect(harEndringer(roller, roller)).toBe(false);
    });

    it("returnerer false for strukturelt like, men forskjellige objektreferanser", () => {
        const opprinnelige = [lagForelder(), lagBarn()];
        const nåværende = [lagForelder(), lagBarn()];

        expect(harEndringer(opprinnelige, nåværende)).toBe(false);
    });

    it("returnerer true når et barn er lagt til", () => {
        const opprinnelige = [lagForelder()];
        const nåværende = [lagForelder(), lagBarn()];

        expect(harEndringer(opprinnelige, nåværende)).toBe(true);
    });

    it("returnerer true når et barn er fjernet", () => {
        const opprinnelige = [lagForelder(), lagBarn()];
        const nåværende = [lagForelder()];

        expect(harEndringer(opprinnelige, nåværende)).toBe(true);
    });

    it("returnerer true når reell mottaker for et barn er endret", () => {
        const opprinnelige = [lagBarn({ reellMottaker: undefined })];
        const nåværende = [lagBarn({ reellMottaker: "12345678901", reellMottakerType: "barnet_selv" })];

        expect(harEndringer(opprinnelige, nåværende)).toBe(true);
    });

    it("returnerer true når reell mottaker byttes fra én samhandler til en annen", () => {
        const opprinnelige = [
            lagBarn({ reellMottaker: "80000000001", reellMottakerType: "samhandler", reellMottakerNavn: "Kommune A" }),
        ];
        const nåværende = [
            lagBarn({ reellMottaker: "80000000002", reellMottakerType: "samhandler", reellMottakerNavn: "Kommune B" }),
        ];

        expect(harEndringer(opprinnelige, nåværende)).toBe(true);
    });

    it("returnerer false når reell mottaker er uendret, selv om objektet er en ny referanse", () => {
        const opprinnelige = [lagBarn({ reellMottaker: "12345678901", reellMottakerType: "barnet_selv" })];
        const nåværende = [lagBarn({ reellMottaker: "12345678901", reellMottakerType: "barnet_selv" })];

        expect(harEndringer(opprinnelige, nåværende)).toBe(false);
    });
});

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

    it("påvirker ikke harEndringer, selv om barnet har ufullstendig relasjon", () => {
        const roller = [lagForelder(), lagBarn()];

        expect(harEndringer(roller, roller)).toBe(false);
    });
});
