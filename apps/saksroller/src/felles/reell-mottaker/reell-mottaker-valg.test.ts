import { describe, expect, it } from "vitest";
import {
    fraReellMottakerValg,
    initialiserReellMottaker,
    initialiserValg,
    tilReellMottakerValg,
    validerReellMottaker,
} from "./reell-mottaker-valg";

const barn = { ident: "11111111111", navn: "Test Barn" };

describe("reell mottaker-regler", () => {
    it("oversetter samhandler mellom skjemaverdi og valg uten å endre verdien", () => {
        const skjemaverdi = {
            reellMottakerType: "samhandler" as const,
            reellMottaker: "SAM123",
            reellMottakerNavn: "Test kommune",
        };

        const valg = tilReellMottakerValg(skjemaverdi);

        expect(valg).toEqual({ type: "samhandler", ident: "SAM123", navn: "Test kommune" });
        expect(fraReellMottakerValg(valg)).toEqual(skjemaverdi);
    });

    it("initialiserer påkrevd valg med barnet selv", () => {
        expect(initialiserReellMottaker({}, "påkrevd", barn)).toEqual({
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
            reellMottakerType: "samhandler",
            reellMottaker: undefined,
            reellMottakerNavn: undefined,
        });
    });

    it("gir riktig valideringsfeil for myndig barn og manglende samhandler", () => {
        expect(validerReellMottaker({}, "myndig-barn")).toEqual([
            {
                felt: "reellMottakerType",
                melding: "Reell mottaker må registreres for barn over 18 år",
            },
        ]);
        expect(validerReellMottaker({ reellMottakerType: "samhandler" }, "alltid")).toEqual([
            { felt: "reellMottaker", melding: "Du må registrere reell mottaker" },
        ]);
    });
});

describe("initialiserValg", () => {
    const samhandler = { type: "samhandler", ident: "SAM123", navn: "Test kommune" } as const;
    const barnetSelv = { type: "barnet_selv", ident: barn.ident, navn: barn.navn } as const;

    it.each([
        { regel: "valgfri", valg: {}, forventet: {} },
        { regel: "påkrevd", valg: {}, forventet: barnetSelv },
        { regel: "påkrevd", valg: samhandler, forventet: samhandler },
        { regel: "kun-samhandler", valg: barnetSelv, forventet: { type: "samhandler" } },
        { regel: "kun-samhandler", valg: {}, forventet: { type: "samhandler" } },
        { regel: "kun-samhandler", valg: samhandler, forventet: samhandler },
    ] as const)("$regel med $valg gir $forventet", ({ regel, valg, forventet }) => {
        expect(initialiserValg(valg, regel, barn)).toEqual(forventet);
    });
});
