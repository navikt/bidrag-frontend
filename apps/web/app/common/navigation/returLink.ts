import { useLocation, useSearchParams } from "react-router";
import { getBisysSessionParams } from "~/common/bisys/bisys-params.ts";

/** Query-parameter som forteller hvilken side brukeren ble rutet fra. */
export const RETUR_PARAM = "from";

/** Ruteparametere som kan leses ut av gjeldende URL, og som returmål kan bygge lenker med. */
interface ReturKontekst {
    saksnummer?: string;
    brukerid?: string;
}

interface ReturMål {
    /** Navnet på siden slik den vises i tilbakelenken. */
    label: string;
    /** Bygger stien det skal navigeres tilbake til, eller null når konteksten mangler. */
    path: (kontekst: ReturKontekst) => string | null;
}

const sakPath =
    (side: string) =>
    ({ saksnummer }: ReturKontekst) =>
        saksnummer ? `/sak/${saksnummer}/${side}` : null;

/**
 * Sider man kan bli rutet fra. Nøkkelen brukes som verdi i `?from=<nøkkel>`.
 * Nye returmål legges til her — resten av mekanikken er generisk.
 */
const RETUR_MÅL = {
    sakshistorikk: { label: "Sakshistorikk", path: sakPath("sakshistorikk") },
    belopshistorikk: { label: "Beløpshistorikk", path: sakPath("belopshistorikk") },
    fogdhistorikk: { label: "Fogdhistorikk", path: sakPath("fogdhistorikk") },
    saksreskontro: { label: "Saksreskontro", path: sakPath("reskontro") },
    dokumenter: { label: "Dokumenter", path: sakPath("dokumenter") },
    brukerreskontro: {
        label: "Brukerreskontro",
        path: ({ brukerid }: ReturKontekst) => (brukerid ? `/bruker/${brukerid}/reskontro` : null),
    },
} satisfies Record<string, ReturMål>;

export type ReturMålId = keyof typeof RETUR_MÅL;

function erReturMålId(verdi: string | null): verdi is ReturMålId {
    return verdi !== null && verdi in RETUR_MÅL;
}

/** Ruteparametere leses fra stien fordi headeren ligger utenfor rutekonteksten til sidene. */
function lesReturKontekst(pathname: string): ReturKontekst {
    return {
        saksnummer: pathname.match(/^\/sak\/([^/]+)/)?.[1],
        brukerid: pathname.match(/^\/bruker\/([^/]+)/)?.[1],
    };
}

/**
 * Bygger en lenke til `path` som husker hvilken side brukeren kom fra,
 * slik at tilbakelenken i headeren peker dit i stedet for til Bisys.
 */
export function medReturMål(path: string, returMål: ReturMålId, params?: URLSearchParams): string {
    const queryParams = new URLSearchParams(params);
    queryParams.set(RETUR_PARAM, returMål);
    return `${path}?${queryParams}`;
}

/**
 * Tilbakelenken til siden brukeren ble rutet fra, eller null når `?from=` mangler,
 * er ukjent, eller gjeldende URL ikke har ruteparameterne målet trenger.
 */
export function useReturLink(): { label: string; href: string } | null {
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();

    const returMålId = searchParams.get(RETUR_PARAM);
    if (!erReturMålId(returMålId)) return null;

    const returMål = RETUR_MÅL[returMålId];
    const path = returMål.path(lesReturKontekst(pathname));
    if (!path) return null;

    // Bisys-parameterne må følge med tilbake for at Bisys-lenken på målsiden fortsatt skal virke.
    const { enhet, sessionState } = getBisysSessionParams(searchParams);
    const queryParams = new URLSearchParams();
    if (enhet) queryParams.set("enhet", enhet);
    if (sessionState) queryParams.set("sessionState", sessionState);

    const query = queryParams.toString();
    return { label: returMål.label, href: query ? `${path}?${query}` : path };
}
