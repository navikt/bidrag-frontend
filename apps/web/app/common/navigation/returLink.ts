import { getBisysSessionParams } from "@bidrag/common";
import { useLocation, useSearchParams } from "react-router";

/** Query-parameter som forteller hvilken side brukeren ble rutet fra. */
export const RETUR_PARAM = "from";

/**
 * Query-parameter som tar vare på saksnummeret når returmålet ligger under en sak,
 * men målsiden selv ikke har saksnummer i stien (f.eks. brukersider).
 */
const SAKSNR_PARAM = "returSaksnr";

/** Tilbakelenken slik den vises i headeren. */
export interface ReturLenke {
    label: string;
    href: string;
}

/** Ruteparametere som leses ut av gjeldende URL, og som returmål bygger stier med. */
interface ReturKontekst {
    saksnummer?: string;
    brukerid?: string;
}

/** Et løst returmål: stien det skal navigeres til, og eventuelle parametere den trenger. */
interface ReturDestinasjon {
    sti: string;
    params?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stier
// ─────────────────────────────────────────────────────────────────────────────

const sakSti = (saksnummer: string, side?: string) => (side ? `/sak/${saksnummer}/${side}` : `/sak/${saksnummer}`);
const brukerSti = (brukerid: string, side?: string) => (side ? `/bruker/${brukerid}/${side}` : `/bruker/${brukerid}`);

/**
 * Saksbildet finnes bare i Bisys, så vi går via redirect-ruta som sender brukeren
 * til `Sak.do?sessionState=...&saksnr=...`.
 */
const bisysSakDestinasjon = (saksnummer: string): ReturDestinasjon => ({
    sti: "/bisys/sak",
    params: { saksnr: saksnummer },
});

/**
 * Brukeroversikten finnes bare i Bisys, og henter selv opp brukeren fra sesjonen,
 * så den trenger ingen parametere utover `sessionState`.
 */
const bisysBrukeroversiktDestinasjon = (): ReturDestinasjon => ({ sti: "/bisys/brukeroversikt" });

/**
 * Ruteparametere leses fra stien fordi headeren ligger utenfor rutekonteksten til sidene.
 * Kontekst som ikke finnes i stien (f.eks. saksnummer når man står på en brukerside)
 * plukkes opp fra query-parameterne `medReturMål` la igjen.
 */
function hentSakBrukerFraUrl(pathname: string, searchParams: URLSearchParams): ReturKontekst {
    return {
        saksnummer: pathname.match(/^\/sak\/([^/]+)/)?.[1] ?? searchParams.get(SAKSNR_PARAM) ?? undefined,
        brukerid: pathname.match(/^\/bruker\/([^/]+)/)?.[1] ?? undefined,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Eksplisitte returmål — siden brukeren ble rutet fra, angitt med `?from=<id>`
// ─────────────────────────────────────────────────────────────────────────────

interface EksplisittReturMål {
    /** Navnet på siden slik den vises i tilbakelenken. */
    label: string;
    /** Bygger stien det skal navigeres tilbake til, eller null når konteksten mangler. */
    sti: (kontekst: ReturKontekst) => string | null;
}

/** Returmål som ligger under en sak. */
const fraSak = (label: string, side: string): EksplisittReturMål => ({
    label,
    sti: ({ saksnummer }) => (saksnummer ? sakSti(saksnummer, side) : null),
});

/** Returmål som ligger under en bruker. */
const fraBruker = (label: string, side: string): EksplisittReturMål => ({
    label,
    sti: ({ brukerid }) => (brukerid ? brukerSti(brukerid, side) : null),
});

/**
 * Sider man kan bli rutet fra. Nøkkelen brukes som verdi i `?from=<nøkkel>`.
 * Nye returmål legges til her — resten av mekanikken er generisk.
 */
const RETUR_MÅL = {
    sakshistorikk: fraSak("Sakshistorikk", "sakshistorikk"),
    belopshistorikk: fraSak("Beløpshistorikk", "belopshistorikk"),
    fogdhistorikk: fraSak("Fogdhistorikk", "fogdhistorikk"),
    saksreskontro: fraSak("Saksreskontro", "reskontro"),
    dokumenter: fraSak("Dokumenter", "dokumenter"),
    brukerreskontro: fraBruker("Brukerreskontro", "reskontro"),
} satisfies Record<string, EksplisittReturMål>;

export type ReturMålId = keyof typeof RETUR_MÅL;

function erReturMålId(verdi: string | null): verdi is ReturMålId {
    return verdi !== null && verdi in RETUR_MÅL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard returmål — brukes når `?from=` mangler, basert på siden man står på
// ─────────────────────────────────────────────────────────────────────────────

interface StandardReturMål {
    /** Navnet på foreldresiden slik den vises i tilbakelenken. */
    label: string;
    /** Henter id-en foreldresiden trenger, eller undefined når vi ikke står i denne konteksten. */
    id: (kontekst: ReturKontekst) => string | undefined;
    /** Undersidene som skal falle tilbake til foreldresiden. */
    undersider: string[];
    /** Bygger stien til en underside, brukt for å kjenne igjen hvor vi står. */
    undersideSti: (id: string, side: string) => string;
    /** Lenken tilbake til foreldresiden. */
    destinasjon: (id: string) => ReturDestinasjon;
}

/**
 * Foreldresider undersider faller tilbake til når `?from=` mangler.
 * Rekkefølgen avgjør prioritet ved overlappende treff.
 */
const STANDARD_RETUR_MÅL: StandardReturMål[] = [
    {
        label: "Sak",
        id: ({ saksnummer }) => saksnummer,
        undersider: ["fogdhistorikk", "belopshistorikk", "reskontro", "sakshistorikk"],
        undersideSti: sakSti,
        destinasjon: bisysSakDestinasjon,
    },
    {
        label: "Brukeroversikt",
        id: ({ brukerid }) => brukerid,
        undersider: ["reskontro"],
        undersideSti: brukerSti,
        destinasjon: bisysBrukeroversiktDestinasjon,
    },
];

/** Finner foreldresiden til gjeldende sti, eller null når ingen standardmål passer. */
function finnStandardReturMål(
    pathname: string,
    kontekst: ReturKontekst,
): (ReturDestinasjon & { label: string }) | null {
    for (const mål of STANDARD_RETUR_MÅL) {
        const id = mål.id(kontekst);
        if (!id) continue;

        const erTreff = mål.undersider.some((side) => erSammeEllerUnder(pathname, mål.undersideSti(id, side)));
        if (erTreff) return { label: mål.label, ...mål.destinasjon(id) };
    }
    return null;
}

/** Sjekker om `pathname` er `sti` eller en underside av den. */
function erSammeEllerUnder(pathname: string, sti: string): boolean {
    return pathname === sti || pathname.startsWith(`${sti}/`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Offentlig API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bygger en lenke til `path` som husker hvilken side brukeren kom fra,
 * slik at tilbakelenken i headeren peker dit i stedet for til Bisys.
 *
 * Når returmålet ligger under en sak, men `path` ikke har saksnummer i stien,
 * må `returKontekst.saksnummer` sendes med så tilbakelenken kan bygges.
 */
export function medReturMål(
    path: string,
    returMål: ReturMålId,
    params?: URLSearchParams,
    returKontekst?: { saksnummer?: string },
): string {
    const queryParams = new URLSearchParams(params);
    queryParams.set(RETUR_PARAM, returMål);
    if (returKontekst?.saksnummer && !path.startsWith("/sak/")) {
        queryParams.set(SAKSNR_PARAM, returKontekst.saksnummer);
    }
    return `${path}?${queryParams}`;
}

/**
 * Tilbakelenken for headeren. Prioriterer `?from=`-parameteren, og faller ellers
 * tilbake på foreldresiden til siden man står på (f.eks. sakshistorikk → sak).
 * Returnerer null når ingen returmål passer, slik at headeren kan peke til Bisys.
 */
export function useReturLink(): ReturLenke | null {
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();

    const kontekst = hentSakBrukerFraUrl(pathname, searchParams);
    const mål = lesEksplisittReturMål(searchParams, kontekst) ?? finnStandardReturMål(pathname, kontekst);
    if (!mål) return null;

    return { label: mål.label, href: byggHref(mål, searchParams) };
}

function lesEksplisittReturMål(
    searchParams: URLSearchParams,
    kontekst: ReturKontekst,
): (ReturDestinasjon & { label: string }) | null {
    const returMålId = searchParams.get(RETUR_PARAM);
    if (!erReturMålId(returMålId)) return null;

    const { label, sti } = RETUR_MÅL[returMålId];
    const løstSti = sti(kontekst);
    return løstSti ? { label, sti: løstSti } : null;
}

/**
 * Bygger den ferdige lenken. Bisys-parameterne må følge med tilbake for at
 * Bisys-lenken på målsiden fortsatt skal virke.
 */
function byggHref({ sti, params }: ReturDestinasjon, searchParams: URLSearchParams): string {
    const { sessionState } = getBisysSessionParams(searchParams);

    const queryParams = new URLSearchParams(params);
    if (sessionState) queryParams.set("sessionState", sessionState);

    const query = queryParams.toString();
    return query ? `${sti}?${query}` : sti;
}
