import type { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { SakRedigeringData } from "../felles/sakvisning-schema.ts";
import { finnFørsteValideringsfeil } from "./lagring/finn-forste-valideringsfeil.ts";
import { utledSakstype } from "./utled-sakstype.ts";

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

describe("utledSakstype", () => {
    function rolle(type: "BA" | "BM" | "BP") {
        return {
            type,
            rolleType: type,
            fodselsnummer: "1",
            objektnummer: "",
            mottagerErVerge: false,
        } as SakRedigeringData["roller"][number];
    }

    it.each([
        { roller: ["BP", "BM"], forventet: "Ektefellebidrag" },
        { roller: ["BA", "BP"], forventet: "Oppfostringsbidrag" },
        { roller: ["BA", "BM"], forventet: "Farskap" },
        { roller: ["BA", "BP", "BM"], forventet: "Barnebidrag" },
        { roller: [], forventet: "Barnebidrag" },
    ] as const)("$roller gir $forventet", ({ roller, forventet }) => {
        expect(utledSakstype(roller.map(rolle))).toBe(forventet);
    });
});
