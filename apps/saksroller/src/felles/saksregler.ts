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

/**
 * Partene i en sak, uavhengig av hvordan skjemaet lagrer dem. `bp` og `bm` er identen når parten er kjent.
 * `erLagret` betyr at barnet allerede er lagret i saken.
 */
export type SakParter = {
    bp?: string;
    bm?: string;
    bidragsmottakerErUkjent: boolean;
    barn: Array<
        ReellMottakerSkjemaverdi & {
            ident: string;
            erMyndig: boolean;
            alder?: number;
            navn?: string;
            erLagret?: boolean;
        }
    >;
};

/** Hvor feilen hører hjemme. Hvert skjema oversetter dette til sine egne feltstier. */
export type Saksfeil =
    | { gjelder: "BP" | "BM"; melding: string }
    | { gjelder: "barnliste"; melding: string }
    | { gjelder: "barn"; indeks: number; felt: ReellMottakerFeil["felt"]; melding: string };

const FORELDERROLLE = { BP: "bidragspliktig", BM: "bidragsmottaker" } as const;

export type Sakskontekst = "opprett" | "endre";

export type Saksadvarsel = { gjelder: "barnliste"; melding: string };

/**
 * Forretningsreglene for partene i en sak. Brukes både når saken opprettes og når rollene endres.
 * 🔴 Endringer her påvirker hvilke saker som kan lagres.
 */
export function validerSak(parter: SakParter, sakstype: Sakstype, kontekst: Sakskontekst): Saksfeil[] {
    const feil: Saksfeil[] = [];
    const krev = (oppfylt: boolean, brudd: Saksfeil) => {
        if (!oppfylt) feil.push(brudd);
    };
    const bp = parter.bp?.trim();
    const bm = parter.bm?.trim();
    const barnIdenter = parter.barn.map((barn) => barn.ident);
    const antallBarn = parter.barn.length;

    krev(!!bp || (sakstype !== "Ektefellebidrag" && sakstype !== "Oppfostringsbidrag"), {
        gjelder: "BP",
        melding: `Du må registrere ${FORELDERROLLE.BP}`,
    });
    krev(!bp || !barnIdenter.includes(bp), { gjelder: "BP", melding: "Et barn kan ikke være forelder i saken" });
    krev(!!bm || (sakstype !== "Ektefellebidrag" && sakstype !== "Farskap"), {
        gjelder: "BM",
        melding: `Du må registrere ${FORELDERROLLE.BM}`,
    });
    krev(!bm || !barnIdenter.includes(bm), { gjelder: "BM", melding: "Et barn kan ikke være forelder i saken" });
    krev(!erSammeForelder(parter.bp, parter.bm), { gjelder: "BM", melding: "Samme person kan ikke være begge parter" });
    krev(!!bm || sakstype !== "Barnebidrag" || antallBarn > 0, {
        gjelder: "barnliste",
        melding: "Du må velge minst ett barn.",
    });
    krev(kontekst === "endre" || sakstype !== "Farskap" || antallBarn <= 1, {
        gjelder: "barnliste",
        melding: "En farskapssak kan bare gjelde ett barn.",
    });
    feil.push(...validerReellMottakere(parter, sakstype, kontekst));

    return feil;
}

/** Regler som gir advarsel, men ikke stopper lagring. */
export function finnSaksadvarsler(parter: SakParter, sakstype: Sakstype, kontekst: Sakskontekst): Saksadvarsel[] {
    const advarsler: Saksadvarsel[] = [];
    const advar = (brutt: boolean, melding: string) => {
        if (brutt) advarsler.push({ gjelder: "barnliste", melding });
    };
    const harBm = !!parter.bm?.trim();
    const antallBarn = parter.barn.length;

    advar(
        (sakstype === "Farskap" || sakstype === "Oppfostringsbidrag") && antallBarn === 0,
        kontekst === "opprett" ? "Du har ikke valgt barn. Saken blir opprettet uten barn." : "Saken har ingen barn.",
    );
    advar(kontekst === "endre" && sakstype === "Farskap" && antallBarn > 1, "En farskapssak bør bare gjelde ett barn.");
    for (const barn of parter.barn) {
        const barnetsNavn = barn.navn ?? barn.ident;
        advar(
            kontekst === "endre" && sakstype !== "Oppfostringsbidrag" && !harBm && !barn.reellMottakerType,
            `${barnetsNavn} har ingen reell mottaker, og saken mangler bidragsmottaker.`,
        );
        advar(
            !barn.erLagret && barn.alder !== undefined && barn.alder > MAKS_ALDER_BARN,
            `${barnetsNavn} er ${barn.alder} år, over maksalderen for barn på ${MAKS_ALDER_BARN} år.`,
        );
    }

    return advarsler;
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

/** 🔴 Ved endring krever bidrag-sak reell mottaker bare for myndige barn. Manglende BM gir en advarsel. */
export function reellMottakerRegelVedEndring(sakstype: Sakstype): ReellMottakerRegel {
    return reellMottakerRegel(sakstype, false);
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

function validerReellMottakere(parter: SakParter, sakstype: Sakstype, kontekst: Sakskontekst): Saksfeil[] {
    const regel =
        kontekst === "endre"
            ? reellMottakerRegelVedEndring(sakstype)
            : reellMottakerRegel(sakstype, parter.bidragsmottakerErUkjent);
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
