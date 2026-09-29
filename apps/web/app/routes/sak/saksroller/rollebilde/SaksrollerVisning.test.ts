import type { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { sakstypeForArbeidsfordeling } from "../felles/saksregler.ts";
import type { SakRedigeringData } from "../felles/sakvisning-schema.ts";
import { finnFørsteValideringsfeil } from "./lagring/finn-forste-valideringsfeil.ts";

const zodTypefeil = { type: "invalid_type", message: "Invalid input: expected string, received null" };
const egendefinert = (message: string) => ({ type: "custom", message });
const førsteFeil = (feil: object) => finnFørsteValideringsfeil(feil as FieldErrors<SakRedigeringData>);

describe("finnFørsteValideringsfeil", () => {
    it("gir undefined uten feil", () => {
        expect(førsteFeil({})).toBeUndefined();
    });

    it("finner egendefinert feil på toppnivå", () => {
        expect(førsteFeil({ saksnummer: egendefinert("Ugyldig saksnummer") })).toBe("Ugyldig saksnummer");
    });

    it("finner egendefinert feil nestet i roller", () => {
        expect(førsteFeil({ roller: [undefined, { reellMottaker: egendefinert("RM mangler") }] })).toBe("RM mangler");
    });

    it("hopper over rå Zod-typefeil", () => {
        expect(førsteFeil({ saksnummer: zodTypefeil })).toBeUndefined();
        expect(førsteFeil({ saksnummer: zodTypefeil, roller: [{ reellMottaker: egendefinert("RM mangler") }] })).toBe(
            "RM mangler",
        );
    });
});

describe("sakstypeForArbeidsfordeling", () => {
    it.each([
        { arbeidsfordeling: "EFS", forventet: "Ektefellebidrag" },
        { arbeidsfordeling: "OPS", forventet: "Oppfostringsbidrag" },
        { arbeidsfordeling: "FRS", forventet: "Farskap" },
        { arbeidsfordeling: "EEN", forventet: "Barnebidrag" },
        { arbeidsfordeling: undefined, forventet: "Barnebidrag" },
    ] as const)("$arbeidsfordeling gir $forventet", ({ arbeidsfordeling, forventet }) => {
        expect(sakstypeForArbeidsfordeling(arbeidsfordeling)).toBe(forventet);
    });
});
