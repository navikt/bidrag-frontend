import type { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { finnFørsteValideringsfeil, utledSakstype } from "./SaksrollerPage.tsx";
import type { SakRedigeringData } from "./sakvisning-schema.ts";

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

    it("returnerer Ektefellebidrag når saken har BP og BM, men ingen barn", () => {
        expect(utledSakstype([rolle("BP"), rolle("BM")])).toBe("Ektefellebidrag");
    });

    it("returnerer Oppfostringsbidrag når saken har barn og BP, men ingen BM", () => {
        expect(utledSakstype([rolle("BA"), rolle("BP")])).toBe("Oppfostringsbidrag");
    });

    it("returnerer Farskap når saken har barn og BM, men ingen BP", () => {
        expect(utledSakstype([rolle("BA"), rolle("BM")])).toBe("Farskap");
    });

    it("returnerer Barnebidrag som standard når saken har barn, BP og BM", () => {
        expect(utledSakstype([rolle("BA"), rolle("BP"), rolle("BM")])).toBe("Barnebidrag");
    });

    it("returnerer Barnebidrag for en tom rolleliste", () => {
        expect(utledSakstype([])).toBe("Barnebidrag");
    });
});
