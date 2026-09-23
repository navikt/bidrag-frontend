import { describe, expect, it } from "vitest";
import {
    fraReellMottakerValg,
    initialiserReellMottaker,
    reellMottakerValgregel,
    tilReellMottakerValg,
    validerReellMottaker,
} from "./reell-mottaker-regel";

const barn = { ident: "11111111111", navn: "Test Barn" };

describe("reell mottaker-regler", () => {
    it("krever reell mottaker for myndig barn eller ukjent bidragsmottaker", () => {
        expect(reellMottakerValgregel({ type: "etter-barn", bidragsmottakerErUkjent: false }, true)).toBe("påkrevd");
        expect(reellMottakerValgregel({ type: "etter-barn", bidragsmottakerErUkjent: true }, false)).toBe("påkrevd");
        expect(reellMottakerValgregel({ type: "etter-barn", bidragsmottakerErUkjent: false }, false)).toBe("valgfri");
    });

    it("oversetter annen_person til samhandlervalg uten å endre skjemaverdien", () => {
        const skjemaverdi = {
            reellMottakerType: "annen_person" as const,
            reellMottaker: "SAM123",
            reellMottakerNavn: "Test kommune",
        };

        const valg = tilReellMottakerValg(skjemaverdi, barn);

        expect(valg).toEqual({ type: "samhandler", ident: "SAM123", navn: "Test kommune" });
        expect(fraReellMottakerValg(valg)).toEqual(skjemaverdi);
    });

    it("initialiserer påkrevd valg med barnet selv", () => {
        expect(initialiserReellMottaker({ reellMottakerType: "ingen" }, "påkrevd", barn)).toEqual({
            reellMottakerType: "barnet_selv",
            reellMottaker: barn.ident,
            reellMottakerNavn: barn.navn,
        });
    });

    it("initialiserer kun-samhandler uten å gjenbruke barnet som mottaker", () => {
        expect(
            initialiserReellMottaker(
                {
                    reellMottakerType: "barnet_selv",
                    reellMottaker: barn.ident,
                    reellMottakerNavn: barn.navn,
                },
                "kun-samhandler",
                barn,
            ),
        ).toEqual({
            reellMottakerType: "annen_person",
            reellMottaker: "",
            reellMottakerNavn: "",
        });
    });

    it("gir riktig valideringsfeil for myndig barn og manglende samhandler", () => {
        expect(validerReellMottaker({ reellMottakerType: "ingen" }, "myndig-barn")).toEqual([
            {
                felt: "reellMottakerType",
                melding: "Reell mottaker må registreres for barn over 18 år",
            },
        ]);
        expect(validerReellMottaker({ reellMottakerType: "annen_person" }, "alltid")).toEqual([
            { felt: "reellMottaker", melding: "Du må registrere reell mottaker" },
        ]);
    });
});
