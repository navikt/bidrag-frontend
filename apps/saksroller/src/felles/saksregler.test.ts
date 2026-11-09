import { describe, expect, it } from "vitest";
import {
    finnSaksadvarsler,
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
    return validerSak(sak, sakstype, "opprett").map(({ gjelder, melding }) => `${gjelder}: ${melding}`);
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
        {
            sakstype: "Barnebidrag",
            beskrivelse: "barn som bidragsmottaker",
            sak: parter({ bp: BP, bm: BARN.ident, barn: [BARN] }),
            forventet: ["BM: Et barn kan ikke være forelder i saken"],
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
            forventet: [],
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
            forventet: ["BP: Du må registrere bidragspliktig"],
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

describe("validerSak ved endring", () => {
    it("farskap med flere barn sperrer ikke", () => {
        const sak = parter({ bm: BM, barn: [BARN, BARN_2] });
        expect(validerSak(sak, "Farskap", "endre")).toEqual([]);
    });

    it("øvrige sperrer gjelder fortsatt", () => {
        const sak = parter({ bm: BM, barn: [BARN, MYNDIG_BARN] });
        expect(validerSak(sak, "Farskap", "endre").map((f) => f.melding)).toEqual([
            "Reell mottaker må registreres for barn over 18 år",
        ]);
    });

    it("barnebidrag uten BM sperrer bare myndige barn uten RM", () => {
        const sak = parter({ bp: BP, barn: [BARN, MYNDIG_BARN] });
        expect(validerSak(sak, "Barnebidrag", "endre").map((f) => f.melding)).toEqual([
            "Reell mottaker må registreres for barn over 18 år",
        ]);
    });
});

describe("finnSaksadvarsler", () => {
    it("farskap med flere barn gir advarsel ved endring", () => {
        const sak = parter({ bm: BM, barn: [BARN, BARN_2] });
        expect(finnSaksadvarsler(sak, "Farskap", "endre")).toEqual([
            { gjelder: "barnliste", melding: "En farskapssak bør bare gjelde ett barn." },
        ]);
    });

    it("farskap med flere barn gir ingen advarsel ved opprettelse, der det er en sperre", () => {
        const sak = parter({ bm: BM, barn: [BARN, BARN_2] });
        expect(finnSaksadvarsler(sak, "Farskap", "opprett")).toEqual([]);
    });

    it("farskap med ett barn gir ingen advarsel", () => {
        expect(finnSaksadvarsler(parter({ bm: BM, barn: [BARN] }), "Farskap", "endre")).toEqual([]);
    });

    it("barnebidrag med flere barn gir ingen advarsel", () => {
        const sak = parter({ bp: BP, bm: BM, barn: [BARN, BARN_2] });
        expect(finnSaksadvarsler(sak, "Barnebidrag", "endre")).toEqual([]);
    });

    it.each<{ sakstype: Sakstype; sak: SakParter }>([
        { sakstype: "Farskap", sak: parter({ bm: BM }) },
        { sakstype: "Oppfostringsbidrag", sak: parter({ bp: BP }) },
    ])("$sakstype uten barn gir advarsel ved opprettelse og endring", ({ sakstype, sak }) => {
        expect(finnSaksadvarsler(sak, sakstype, "opprett").map((a) => a.melding)).toEqual([
            "Du har ikke valgt barn. Saken blir opprettet uten barn.",
        ]);
        expect(finnSaksadvarsler(sak, sakstype, "endre").map((a) => a.melding)).toEqual(["Saken har ingen barn."]);
    });

    it("barnebidrag uten barn gir ingen advarsel", () => {
        expect(finnSaksadvarsler(parter({ bp: BP, bm: BM }), "Barnebidrag", "opprett")).toEqual([]);
    });

    it.each(["opprett", "endre"] as const)("nytt barn over 24 år gir advarsel ved %s", (kontekst) => {
        const sak = parter({ bp: BP, bm: BM, barn: [barn(BARN.ident, { alder: 25, navn: "Ola" })] });
        expect(finnSaksadvarsler(sak, "Barnebidrag", kontekst).map((a) => a.melding)).toEqual([
            "Ola er 25 år, over maksalderen for barn på 24 år.",
        ]);
    });

    it("barn på 24 år gir ingen advarsel", () => {
        const sak = parter({ bp: BP, bm: BM, barn: [barn(BARN.ident, { alder: 24 })] });
        expect(finnSaksadvarsler(sak, "Barnebidrag", "opprett")).toEqual([]);
    });

    it("lagret barn over 24 år gir ingen advarsel", () => {
        const sak = parter({ bp: BP, bm: BM, barn: [barn(BARN.ident, { alder: 30, erLagret: true })] });
        expect(finnSaksadvarsler(sak, "Barnebidrag", "endre")).toEqual([]);
    });

    it("barn uten RM i sak uten BM gir advarsel ved endring", () => {
        const sak = parter({ bp: BP, barn: [barn(BARN.ident, { navn: "Ola" }), BARN_MED_SAMHANDLER] });
        expect(finnSaksadvarsler(sak, "Barnebidrag", "endre").map((a) => a.melding)).toEqual([
            "Ola har ingen reell mottaker, og saken mangler bidragsmottaker.",
        ]);
    });

    it("barn uten RM i sak uten BM gir ingen advarsel ved opprettelse, der det er en sperre", () => {
        expect(finnSaksadvarsler(parter({ bp: BP, barn: [BARN] }), "Barnebidrag", "opprett")).toEqual([]);
    });

    it("oppfostringsbidrag uten BM gir ingen RM-advarsel", () => {
        expect(finnSaksadvarsler(parter({ bp: BP, barn: [BARN] }), "Oppfostringsbidrag", "endre")).toEqual([]);
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
