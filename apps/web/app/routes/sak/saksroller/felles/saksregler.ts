import {
    type ReellMottakerFeil,
    type ReellMottakerSkjemaverdi,
    type ReellMottakerValideringsgrunn,
    validerReellMottaker,
} from "./reell-mottaker/reell-mottaker-regel";

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
    if (parter.bp?.trim() && parter.bp === parter.bm) {
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

function validerReellMottakere(parter: SakParter, sakstype: Sakstype): Saksfeil[] {
    return parter.barn.flatMap((barn, indeks) =>
        validerReellMottaker(barn, reellMottakerGrunn(barn, parter, sakstype)).map(({ felt, melding }) => ({
            gjelder: "barn" as const,
            indeks,
            felt,
            melding,
        })),
    );
}

function reellMottakerGrunn(
    barn: SakParter["barn"][number],
    parter: SakParter,
    sakstype: Sakstype,
): ReellMottakerValideringsgrunn | null {
    if (sakstype === "Oppfostringsbidrag") return "alltid";
    if (sakstype !== "Barnebidrag") return null;
    if (barn.erMyndig) return "myndig-barn";
    return parter.bidragsmottakerErUkjent ? "ukjent-bidragsmottaker" : null;
}
