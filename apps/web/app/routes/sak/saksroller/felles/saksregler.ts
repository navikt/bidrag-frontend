import type { ReellMottakerValgregel } from "./reell-mottaker/ReellMottakerValgGruppe";
import {
    type ReellMottakerFeil,
    type ReellMottakerSkjemaverdi,
    type ReellMottakerValideringsgrunn,
    validerReellMottaker,
} from "./reell-mottaker/reell-mottaker-valg";

export const MYNDYG_BARN_ALDER = 18;
export const MAKS_ALDER_BARN = 24;

export type Sakstype = "Barnebidrag" | "Ektefellebidrag" | "Oppfostringsbidrag" | "Farskap";

/** Sakstypen følger arbeidsfordelingen saken ble opprettet med, og endres aldri. */
export function sakstypeForArbeidsfordeling(arbeidsfordeling: string | undefined): Sakstype {
    switch (arbeidsfordeling) {
        case "EFS":
            return "Ektefellebidrag";
        case "OPS":
            return "Oppfostringsbidrag";
        case "FRS":
            return "Farskap";
        default:
            return "Barnebidrag";
    }
}

/** Partene i en sak, uavhengig av hvordan skjemaet lagrer dem. `bp` og `bm` er identen når parten er kjent. */
export type SakParter = {
    bp?: string;
    bm?: string;
    bidragsmottakerErUkjent: boolean;
    barn: Array<ReellMottakerSkjemaverdi & { ident: string; erMyndig: boolean }>;
};

/** Hvor feilen hører hjemme. Hvert skjema oversetter dette til sine egne feltstier. */
export type Saksfeil =
    | { gjelder: "BP" | "BM"; melding: string }
    | { gjelder: "barnliste"; melding: string }
    | { gjelder: "barn"; indeks: number; felt: ReellMottakerFeil["felt"]; melding: string };

const PÅKREVDE_FORELDRE: Record<Sakstype, Array<"BP" | "BM">> = {
    Barnebidrag: [],
    Ektefellebidrag: ["BP", "BM"],
    Oppfostringsbidrag: ["BP"],
    Farskap: ["BM"],
};

const FORELDERROLLE = { BP: "bidragspliktig", BM: "bidragsmottaker" } as const;

/**
 * Forretningsreglene for partene i en sak. Brukes både når saken opprettes og når rollene endres.
 * 🔴 Endringer her påvirker hvilke saker som kan lagres.
 */
export function validerSak(parter: SakParter, sakstype: Sakstype): Saksfeil[] {
    return [
        ...validerForeldre(parter, sakstype),
        ...validerAntallBarn(parter, sakstype),
        ...validerReellMottakere(parter, sakstype),
    ];
}

function validerForeldre(parter: SakParter, sakstype: Sakstype): Saksfeil[] {
    const barnIdenter = parter.barn.map((barn) => barn.ident);
    const feil: Saksfeil[] = (["BP", "BM"] as const).flatMap((type) => {
        const ident = (type === "BP" ? parter.bp : parter.bm)?.trim();
        if (!ident) {
            return PÅKREVDE_FORELDRE[sakstype].includes(type)
                ? [{ gjelder: type, melding: `Du må registrere ${FORELDERROLLE[type]}` }]
                : [];
        }
        return barnIdenter.includes(ident)
            ? [{ gjelder: type, melding: "Et barn kan ikke være forelder i saken" }]
            : [];
    });
    if (erSammeForelder(parter.bp, parter.bm)) {
        feil.push({ gjelder: "BM", melding: "Samme person kan ikke være begge parter" });
    }
    return feil;
}

function validerAntallBarn(parter: SakParter, sakstype: Sakstype): Saksfeil[] {
    const barnPåkrevd = sakstype !== "Ektefellebidrag" && (sakstype !== "Barnebidrag" || !parter.bm?.trim());
    if (barnPåkrevd && parter.barn.length === 0) {
        return [{ gjelder: "barnliste", melding: "Du må velge minst ett barn." }];
    }
    if (sakstype === "Farskap" && parter.barn.length > 1) {
        return [{ gjelder: "barnliste", melding: "En farskapssak kan bare gjelde ett barn." }];
    }
    return [];
}

/** BP og BM kan ikke være samme person. */
export function erSammeForelder(bp: string | undefined, bm: string | undefined): boolean {
    return !!bp?.trim() && bp === bm;
}

/**
 * Hvordan reell mottaker behandles for barna i saken.
 * - `skjult`: saken har ikke reell mottaker.
 * - `kun-myndige`: påkrevd for myndige barn, ellers ikke aktuelt.
 * - `etter-barn`: påkrevd for myndige barn og når bidragsmottaker er ukjent, ellers valgfri.
 * - `alltid-samhandler`: påkrevd for alle barn, og må være en samhandler.
 */
export type ReellMottakerRegel =
    | { type: "skjult" }
    | { type: "kun-myndige" }
    | { type: "etter-barn"; bidragsmottakerErUkjent: boolean }
    | { type: "alltid-samhandler" };

/** 🔴 Farskap følger bidrag-sak, som krever reell mottaker for myndige barn i alle saker. */
export function reellMottakerRegel(sakstype: Sakstype, bidragsmottakerErUkjent: boolean): ReellMottakerRegel {
    switch (sakstype) {
        case "Ektefellebidrag":
            return { type: "skjult" };
        case "Farskap":
            return { type: "kun-myndige" };
        case "Oppfostringsbidrag":
            return { type: "alltid-samhandler" };
        case "Barnebidrag":
            return { type: "etter-barn", bidragsmottakerErUkjent };
    }
}

/** Valget saksbehandler får for ett barn, eller `undefined` når valget ikke er aktuelt. */
export function reellMottakerValgregel(
    regel: ReellMottakerRegel,
    erMyndig: boolean,
): ReellMottakerValgregel | undefined {
    switch (regel.type) {
        case "skjult":
            return undefined;
        case "kun-myndige":
            return erMyndig ? "påkrevd" : undefined;
        case "alltid-samhandler":
            return "kun-samhandler";
        case "etter-barn":
            return erMyndig || regel.bidragsmottakerErUkjent ? "påkrevd" : "valgfri";
    }
}

function validerReellMottakere(parter: SakParter, sakstype: Sakstype): Saksfeil[] {
    const regel = reellMottakerRegel(sakstype, parter.bidragsmottakerErUkjent);
    return parter.barn.flatMap((barn, indeks) =>
        validerReellMottaker(barn, reellMottakerGrunn(regel, barn.erMyndig)).map(({ felt, melding }) => ({
            gjelder: "barn" as const,
            indeks,
            felt,
            melding,
        })),
    );
}

function reellMottakerGrunn(regel: ReellMottakerRegel, erMyndig: boolean): ReellMottakerValideringsgrunn | null {
    const valgregel = reellMottakerValgregel(regel, erMyndig);
    if (valgregel === "kun-samhandler") return "alltid";
    if (valgregel !== "påkrevd") return null;
    return erMyndig ? "myndig-barn" : "ukjent-bidragsmottaker";
}
