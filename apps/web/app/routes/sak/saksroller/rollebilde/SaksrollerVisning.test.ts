import type { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { SakRedigeringData } from "../felles/sakvisning-schema.ts";
import { finnFørsteValideringsfeil } from "./lagring/finn-forste-valideringsfeil.ts";
import { utledSakstype } from "./utled-sakstype.ts";

describe("finnFørsteValideringsfeil", () => {
    it("returnerer undefined når det ikke finnes noen feil", () => {
        expect(finnFørsteValideringsfeil({})).toBeUndefined();
    });

    it("finner feilmeldingen på toppnivå når feilen er egendefinert (type custom)", () => {
        const feil = {
            saksnummer: { type: "custom", message: "Saksnummer må være en tekst" },
        } as unknown as FieldErrors<SakRedigeringData>;

        expect(finnFørsteValideringsfeil(feil)).toBe("Saksnummer må være en tekst");
    });

    it("finner feilmeldingen nestet i et array-felt (roller)", () => {
        const feil = {
            roller: [
                undefined,
                {
                    reellMottaker: {
                        type: "custom",
                        message: "Reell mottaker må registreres for barn over 18 år",
                    },
                },
            ],
        } as unknown as FieldErrors<SakRedigeringData>;

        expect(finnFørsteValideringsfeil(feil)).toBe("Reell mottaker må registreres for barn over 18 år");
    });

    it("ignorerer rå Zod-typefeil (ikke type custom) i stedet for å vise dem til bruker", () => {
        const feil = {
            saksnummer: { type: "invalid_type", message: "Invalid input: expected string, received null" },
        } as unknown as FieldErrors<SakRedigeringData>;

        expect(finnFørsteValideringsfeil(feil)).toBeUndefined();
    });

    it("hopper over en rå Zod-typefeil og finner en egendefinert feil lenger ute i treet", () => {
        const feil = {
            saksnummer: { type: "invalid_type", message: "Invalid input: expected string, received null" },
            roller: [
                {
                    reellMottaker: {
                        type: "custom",
                        message: "Reell mottaker må registreres når bidragsmottaker er ukjent",
                    },
                },
            ],
        } as unknown as FieldErrors<SakRedigeringData>;

        expect(finnFørsteValideringsfeil(feil)).toBe("Reell mottaker må registreres når bidragsmottaker er ukjent");
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
