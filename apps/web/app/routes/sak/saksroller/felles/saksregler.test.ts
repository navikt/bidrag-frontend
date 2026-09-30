import { describe, expect, it } from "vitest";
import {
    reellMottakerRegel,
    reellMottakerValgregel,
    type SakParter,
    type Sakstype,
    sakstypeForArbeidsfordeling,
    validerSak,
} from "./saksregler";

const BP = "22222222222";
const BM = "11111111111";

function barn(ident: string, felter: Partial<SakParter["barn"][number]> = {}): SakParter["barn"][number] {
    return { ident, erMyndig: false, ...felter };
}

const BARN = barn("10987654321");
const BARN_2 = barn("10987654322");
const MYNDIG_BARN = barn("01010012345", { erMyndig: true });
const MYNDIG_BARN_MED_RM = {
    ...MYNDIG_BARN,
    reellMottakerType: "barnet_selv" as const,
    reellMottaker: MYNDIG_BARN.ident,
};
const BARN_MED_SAMHANDLER = { ...BARN, reellMottakerType: "samhandler" as const, reellMottaker: "80000123456" };

function parter(felter: Partial<SakParter>): SakParter {
    return { bidragsmottakerErUkjent: !felter.bm, barn: [], ...felter };
}

function meldinger(sakstype: Sakstype, sak: SakParter) {
    return validerSak(sak, sakstype).map(({ gjelder, melding }) => `${gjelder}: ${melding}`);
}

describe("validerSak", () => {
    it.each<{ sakstype: Sakstype; beskrivelse: string; sak: SakParter; forventet: string[] }>([
        {
            sakstype: "Barnebidrag",
            beskrivelse: "BP, BM og barn",
            sak: parter({ bp: BP, bm: BM, barn: [BARN] }),
            forventet: [],
        },
        { sakstype: "Barnebidrag", beskrivelse: "BP og BM uten barn", sak: parter({ bp: BP, bm: BM }), forventet: [] },
        {
            sakstype: "Barnebidrag",
            beskrivelse: "ukjent BM uten barn",
            sak: parter({ bp: BP }),
            forventet: ["barnliste: Du må velge minst ett barn."],
        },
        {
            sakstype: "Barnebidrag",
            beskrivelse: "ukjent BM og barn uten RM",
            sak: parter({ bp: BP, barn: [BARN] }),
            forventet: ["barn: Reell mottaker må registreres når bidragsmottaker er ukjent"],
        },
        {
            sakstype: "Barnebidrag",
            beskrivelse: "myndig barn uten RM",
            sak: parter({ bp: BP, bm: BM, barn: [MYNDIG_BARN] }),
            forventet: ["barn: Reell mottaker må registreres for barn over 18 år"],
        },
        {
            sakstype: "Barnebidrag",
            beskrivelse: "myndig barn med RM",
            sak: parter({ bp: BP, bm: BM, barn: [MYNDIG_BARN_MED_RM] }),
            forventet: [],
        },
        {
            sakstype: "Barnebidrag",
            beskrivelse: "samme person som BP og BM",
            sak: parter({ bp: BP, bm: BP, barn: [BARN] }),
            forventet: ["BM: Samme person kan ikke være begge parter"],
        },
        {
            sakstype: "Barnebidrag",
            beskrivelse: "barn som forelder",
            sak: parter({ bp: BARN.ident, bm: BM, barn: [BARN] }),
            forventet: ["BP: Et barn kan ikke være forelder i saken"],
        },
        { sakstype: "Farskap", beskrivelse: "BM og ett barn", sak: parter({ bm: BM, barn: [BARN] }), forventet: [] },
        {
            sakstype: "Farskap",
            beskrivelse: "uten BM",
            sak: parter({ barn: [BARN] }),
            forventet: ["BM: Du må registrere bidragsmottaker"],
        },
        {
            sakstype: "Farskap",
            beskrivelse: "uten barn",
            sak: parter({ bm: BM }),
            forventet: ["barnliste: Du må velge minst ett barn."],
        },
        {
            sakstype: "Farskap",
            beskrivelse: "to barn",
            sak: parter({ bm: BM, barn: [BARN, BARN_2] }),
            forventet: ["barnliste: En farskapssak kan bare gjelde ett barn."],
        },
        {
            sakstype: "Farskap",
            beskrivelse: "myndig barn uten RM",
            sak: parter({ bm: BM, barn: [MYNDIG_BARN] }),
            forventet: ["barn: Reell mottaker må registreres for barn over 18 år"],
        },
        {
            sakstype: "Oppfostringsbidrag",
            beskrivelse: "BP og barn med samhandler",
            sak: parter({ bp: BP, barn: [BARN_MED_SAMHANDLER] }),
            forventet: [],
        },
        {
            sakstype: "Oppfostringsbidrag",
            beskrivelse: "barn uten RM",
            sak: parter({ bp: BP, barn: [BARN] }),
            forventet: ["barn: Reell mottaker må registreres for hvert barn"],
        },
        {
            sakstype: "Oppfostringsbidrag",
            beskrivelse: "uten BP og barn",
            sak: parter({}),
            forventet: ["BP: Du må registrere bidragspliktig", "barnliste: Du må velge minst ett barn."],
        },
        { sakstype: "Ektefellebidrag", beskrivelse: "BP og BM", sak: parter({ bp: BP, bm: BM }), forventet: [] },
        {
            sakstype: "Ektefellebidrag",
            beskrivelse: "bare BP",
            sak: parter({ bp: BP }),
            forventet: ["BM: Du må registrere bidragsmottaker"],
        },
    ])("$sakstype: $beskrivelse", ({ sakstype, sak, forventet }) => {
        expect(meldinger(sakstype, sak)).toEqual(forventet);
    });
});

describe("reellMottakerValgregel", () => {
    it.each<{ sakstype: Sakstype; bmUkjent: boolean; erMyndig: boolean; forventet: string | undefined }>([
        { sakstype: "Barnebidrag", bmUkjent: false, erMyndig: false, forventet: "valgfri" },
        { sakstype: "Barnebidrag", bmUkjent: false, erMyndig: true, forventet: "påkrevd" },
        { sakstype: "Barnebidrag", bmUkjent: true, erMyndig: false, forventet: "påkrevd" },
        { sakstype: "Farskap", bmUkjent: false, erMyndig: false, forventet: undefined },
        { sakstype: "Farskap", bmUkjent: false, erMyndig: true, forventet: "påkrevd" },
        { sakstype: "Oppfostringsbidrag", bmUkjent: true, erMyndig: false, forventet: "kun-samhandler" },
        { sakstype: "Oppfostringsbidrag", bmUkjent: true, erMyndig: true, forventet: "kun-samhandler" },
        { sakstype: "Ektefellebidrag", bmUkjent: false, erMyndig: true, forventet: undefined },
    ])("$sakstype, BM ukjent=$bmUkjent, myndig=$erMyndig gir $forventet", ({
        sakstype,
        bmUkjent,
        erMyndig,
        forventet,
    }) => {
        expect(reellMottakerValgregel(reellMottakerRegel(sakstype, bmUkjent), erMyndig)).toBe(forventet);
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
