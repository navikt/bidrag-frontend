import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { describe, expect, it } from "vitest";
import { validerSak } from "../saksregler";
import { erPersonSomReellMottaker, kanBekrefteReellMottaker, validerReellMottaker } from "./reell-mottaker-regler";
import {
    fraReellMottakerValg,
    initialiserReellMottaker,
    initialiserValg,
    tilReellMottakerValg,
} from "./reell-mottaker-valg";

const BARN_IDENT = genererFnr();
const SAMHANDLER_FNR_IDENT = genererFnr();
const SAMHANDLERLIGNENDE_IDENT = "80000123456";
const BP_IDENT = genererFnr();
const FEIL_REELL_MOTTAKER_IDENT = genererFnr();
const barn = { ident: BARN_IDENT, navn: "Test Barn" };

describe("reell mottaker-regler", () => {
    it("bevarer autoritativ samhandlertype i begge retninger", () => {
        const skjemaverdi = {
            reellMottakerType: "samhandler" as const,
            reellMottaker: "SAM123",
            reellMottakerEntitetstype: "SAMHANDLER" as const,
            reellMottakerNavn: "Test kommune",
        };

        const valg = tilReellMottakerValg(skjemaverdi);

        expect(valg).toEqual({ type: "samhandler", ident: "SAM123", mottakertype: "SAMHANDLER", navn: "Test kommune" });
        expect(fraReellMottakerValg(valg)).toEqual(skjemaverdi);
    });

    it("setter PERSON for barnet selv og tillater en person som mottaker i vanlig sak", () => {
        const valg = tilReellMottakerValg({
            reellMottakerType: "barnet_selv",
            reellMottaker: barn.ident,
            reellMottakerNavn: barn.navn,
        });

        expect(valg.mottakertype).toBe("PERSON");
        expect(fraReellMottakerValg(valg).reellMottakerEntitetstype).toBe("PERSON");
        expect(
            kanBekrefteReellMottaker(
                { type: "samhandler", ident: SAMHANDLERLIGNENDE_IDENT, mottakertype: "PERSON" },
                "påkrevd",
            ),
        ).toBe(true);
        expect(
            validerReellMottaker(
                {
                    reellMottakerType: "samhandler",
                    reellMottaker: SAMHANDLERLIGNENDE_IDENT,
                    reellMottakerEntitetstype: "PERSON",
                },
                "myndig-barn",
            ),
        ).toEqual([]);
    });

    it("initialiserer påkrevd valg med barnet selv", () => {
        expect(initialiserReellMottaker({}, "påkrevd", barn)).toEqual({
            reellMottakerType: "barnet_selv",
            reellMottaker: barn.ident,
            reellMottakerEntitetstype: "PERSON",
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

    it("beholder typeinformasjon når et allerede valgt samhandler initialiseres", () => {
        const verdi = {
            reellMottakerType: "samhandler" as const,
            reellMottaker: SAMHANDLER_FNR_IDENT,
            reellMottakerEntitetstype: "SAMHANDLER" as const,
            reellMottakerNavn: "Registrert samhandler",
        };

        expect(initialiserReellMottaker(verdi, "kun-samhandler", barn)).toEqual(verdi);
        expect(initialiserValg(tilReellMottakerValg(verdi), "kun-samhandler", barn).mottakertype).toBe("SAMHANDLER");
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

    it("krever autoritativ SAMHANDLER-type i OPS, men tillater kun uendret ukjent type eksplisitt", () => {
        const samhandler = {
            reellMottakerType: "samhandler" as const,
            reellMottaker: SAMHANDLER_FNR_IDENT,
            reellMottakerEntitetstype: "SAMHANDLER" as const,
        };
        const person = { ...samhandler, reellMottakerEntitetstype: "PERSON" as const };
        const ukjentType = { ...samhandler, reellMottakerEntitetstype: undefined };

        expect(validerReellMottaker(samhandler, "alltid")).toEqual([]);
        expect(validerReellMottaker({ ...samhandler, reellMottaker: SAMHANDLER_FNR_IDENT }, "alltid")).toEqual([]);
        expect(validerReellMottaker(person, "alltid")).toEqual([
            {
                felt: "reellMottakerEntitetstype",
                melding: "Reell mottaker må være en registrert samhandler",
            },
        ]);
        expect(validerReellMottaker(ukjentType, "alltid")).toHaveLength(1);
        expect(validerReellMottaker(ukjentType, "alltid", true)).toEqual([]);
        expect(validerReellMottaker({ ...ukjentType, reellMottaker: "" }, "alltid", true)).toEqual([
            { felt: "reellMottaker", melding: "Du må registrere reell mottaker" },
        ]);
    });

    it("avviser barnet selv med SAMHANDLER-metadata, også når mottaker ellers er valgfri", () => {
        const barnetSomSamhandler = {
            reellMottakerType: "barnet_selv" as const,
            reellMottaker: barn.ident,
            reellMottakerEntitetstype: "SAMHANDLER" as const,
        };
        const forventetFeil = {
            felt: "reellMottakerEntitetstype",
            melding: "Barnet selv kan ikke ha mottakertype samhandler",
        };

        expect(validerReellMottaker(barnetSomSamhandler, "alltid")).toContainEqual(forventetFeil);
        expect(validerReellMottaker(barnetSomSamhandler, null)).toContainEqual(forventetFeil);
    });

    it("avviser samhandler-valg som bruker barnets egen ident i sakvalidering", () => {
        const feil = validerSak(
            {
                bp: BP_IDENT,
                bidragsmottakerErUkjent: false,
                barn: [
                    {
                        ident: barn.ident,
                        erMyndig: false,
                        reellMottakerType: "samhandler",
                        reellMottaker: barn.ident,
                        reellMottakerEntitetstype: "SAMHANDLER",
                    },
                ],
            },
            "Oppfostringsbidrag",
            "opprett",
        );

        expect(feil).toContainEqual({
            gjelder: "barn",
            indeks: 0,
            felt: "reellMottaker",
            melding: "Barnet kan ikke velges som sin egen reelle mottaker",
        });
    });

    it("krever at barnet selv faktisk er valgt som mottaker", () => {
        const feil = validerSak(
            {
                bp: BP_IDENT,
                bidragsmottakerErUkjent: false,
                barn: [
                    {
                        ident: barn.ident,
                        erMyndig: false,
                        reellMottakerType: "barnet_selv",
                        reellMottaker: FEIL_REELL_MOTTAKER_IDENT,
                        reellMottakerEntitetstype: "PERSON",
                    },
                ],
            },
            "Barnebidrag",
            "opprett",
        );

        expect(feil).toContainEqual({
            gjelder: "barn",
            indeks: 0,
            felt: "reellMottaker",
            melding: "Når barnet selv er reell mottaker, må barnets identitet være valgt",
        });
    });

    it("kan ikke bekrefte person eller ukjent type som OPS-mottaker", () => {
        expect(
            kanBekrefteReellMottaker(
                { type: "samhandler", ident: SAMHANDLER_FNR_IDENT, mottakertype: "SAMHANDLER" },
                "kun-samhandler",
            ),
        ).toBe(true);
        expect(
            kanBekrefteReellMottaker(
                { type: "samhandler", ident: SAMHANDLER_FNR_IDENT, mottakertype: "SAMHANDLER" },
                "kun-samhandler",
            ),
        ).toBe(true);
        expect(
            kanBekrefteReellMottaker(
                { type: "samhandler", ident: SAMHANDLER_FNR_IDENT, mottakertype: "PERSON" },
                "kun-samhandler",
            ),
        ).toBe(false);
        expect(kanBekrefteReellMottaker({ type: "samhandler", ident: SAMHANDLER_FNR_IDENT }, "kun-samhandler")).toBe(
            false,
        );
        expect(
            kanBekrefteReellMottaker({ type: "samhandler", ident: SAMHANDLER_FNR_IDENT }, "kun-samhandler", true),
        ).toBe(true);
        expect(kanBekrefteReellMottaker({ type: "samhandler" }, "kun-samhandler", true)).toBe(false);
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

describe("🔴 verge for reell mottaker", () => {
    it.each([
        {
            valg: { type: "samhandler" as const, ident: SAMHANDLERLIGNENDE_IDENT, mottakertype: "PERSON" as const },
            forventet: true,
        },
        {
            valg: { type: "samhandler" as const, ident: SAMHANDLER_FNR_IDENT, mottakertype: "SAMHANDLER" as const },
            forventet: false,
        },
        {
            valg: { type: "samhandler" as const, ident: SAMHANDLER_FNR_IDENT, mottakertype: "SAMHANDLER" as const },
            forventet: false,
        },
        {
            valg: { type: "samhandler" as const, ident: SAMHANDLERLIGNENDE_IDENT, mottakertype: "PERSON" as const },
            forventet: true,
        },
        { valg: { type: "samhandler" as const, ident: undefined }, forventet: false },
        { valg: { type: "barnet_selv" as const, ident: BARN_IDENT }, forventet: false },
        { valg: { type: undefined, ident: undefined }, forventet: false },
    ])("$valg.type med ident $valg.ident kan ha verge: $forventet", ({ valg, forventet }) => {
        expect(erPersonSomReellMottaker(valg)).toBe(forventet);
    });

    it("bevarer legacy-verge ved ukjent type, men utelater verge for kjent samhandler", () => {
        const ukjentType = fraReellMottakerValg({ type: "samhandler", ident: SAMHANDLER_FNR_IDENT, verge: true });
        const samhandler = fraReellMottakerValg({
            type: "samhandler",
            ident: SAMHANDLER_FNR_IDENT,
            mottakertype: "SAMHANDLER",
            verge: true,
        });

        expect(ukjentType.reellMottakerErVerge).toBe(true);
        expect(fraReellMottakerValg(tilReellMottakerValg(ukjentType)).reellMottakerErVerge).toBe(true);
        expect(samhandler.reellMottakerErVerge).toBeUndefined();
    });

    it("bevarer verge for en autoritativ person selv med samhandlerlignende ident", () => {
        expect(
            fraReellMottakerValg({
                type: "samhandler",
                ident: SAMHANDLERLIGNENDE_IDENT,
                mottakertype: "PERSON",
                verge: true,
            }).reellMottakerErVerge,
        ).toBe(true);
    });
});
