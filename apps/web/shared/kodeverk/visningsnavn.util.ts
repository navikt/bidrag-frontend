import årsak from "./data/årsak.json";
import behandlingstype from "./data/behandlingstype.json";
import beregntil from "./data/beregntil.json";
import bostatus from "./data/bostatus.json";
import engangsbeløptype from "./data/engangsbeløptype.json";
import inntektsrapportering from "./data/inntektsrapportering.json";
import inntektstype from "./data/inntektstype.json";
import offentligidtype from "./data/offentligidtype.json";
import områdekode from "./data/områdekode.json";
import privatavtaletype from "./data/privatavtaletype.json";
import resultat from "./data/resultat.json";
import særbidragskategori from "./data/særbidragskategori.json";
import samværskalkulatorferietype from "./data/samværskalkulatorferietype.json";
import samværskalkulatornetterfrekvens from "./data/samværskalkulatornetterfrekvens.json";
import samværsklasse from "./data/samværsklasse.json";
import sivilstand from "./data/sivilstand.json";
import skolealder from "./data/skolealder.json";
import sluttberegningBarnebidrag from "./data/sluttberegningBarnebidrag.json";
import tilsynstype from "./data/tilsynstype.json";
import utgiftstype from "./data/utgiftstype.json";
import vedtakstype from "./data/vedtakstype.json";
import stønadstype from "./data/stønadstype.json";

type VisningsnavnEntry = {
    intern: string;
    bruker?: {
        NB?: string;
        EN?: string;
    };
};

const visningsnavnData = {
    behandlingstype,
    beregntil,
    bostatus,
    engangsbeløptype,
    inntektsrapportering,
    inntektstype,
    offentligidtype,
    områdekode,
    privatavtaletype,
    resultat,
    samværskalkulatorferietype,
    samværskalkulatornetterfrekvens,
    samværsklasse,
    sivilstand,
    skolealder,
    sluttberegningBarnebidrag,
    stønadstype,
    særbidragskategori,
    tilsynstype,
    utgiftstype,
    vedtakstype,
    årsak,
} satisfies Record<string, Record<string, VisningsnavnEntry>>;

export type VisningsnavnType = keyof typeof visningsnavnData;

/**
 * Slår opp visningsnavn fra statiske JSON-filer.
 * @param type  Kodeverk-type (f.eks. "vedtakstype", "sivilstand")
 * @param verdi Kodeverdien (f.eks. "OPPHØR")
 * @param mål   "intern" (saksbehandler, standard) eller "bruker" (borger, norsk bokmål)
 */
export function hentVisningsnavnFraType<T extends VisningsnavnType>(
    type: T,
    verdi: keyof (typeof visningsnavnData)[T] & string,
    mål: "intern" | "bruker" = "intern"
): string {
    const entry = (visningsnavnData[type] as Record<string, VisningsnavnEntry>)[verdi];
    if (!entry) return verdi;
    if (mål === "bruker") return entry.bruker?.NB ?? entry.intern;
    return entry.intern;
}