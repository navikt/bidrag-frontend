import type { HenvendelseDto } from "@bidrag/api/BidragHenvendelseApi";
import type { SortState } from "@navikt/ds-react";

export type Henvendelsestype = HenvendelseDto["henvendelsestype"];

const HENVENDELSESTYPE_VISNINGSNAVN: Record<Henvendelsestype, string> = {
    CHAT: "Chat",
    MELDINGSKJEDE: "Meldingskjede",
    SAMTALEREFERAT: "Samtalereferat",
    UKJENT: "Ukjent",
};

export function henvendelsestypeVisningsnavn(type: Henvendelsestype): string {
    return HENVENDELSESTYPE_VISNINGSNAVN[type] ?? type;
}

/**
 * Går via `/modia/person`-ruten, som sender alle parametere videre til `{MODIA_URL}/person`.
 * Modia leser `henvendelseId` (med stor I) i `HandleLegacyUrls.tsx` i navikt/modiapersonoversikt
 * og åpner tråden; Modias `traadId` er Salesforce-ens `kjedeId`.
 */
export function modiaLenke(ident: string, kjedeId?: string): string {
    const parametere = new URLSearchParams({ sokFnr: ident });
    if (kjedeId) parametere.set("henvendelseId", kjedeId);
    return `/modia/person?${parametere}`;
}

export type HenvendelseRad = {
    kjedeId: string;
    sisteMeldingSendt?: string | null;
    temagruppe: string;
    tema: string;
    henvendelsestype: string;
};

export function tilHenvendelseRader(
    henvendelser: HenvendelseDto[],
    temaer: Record<string, string> = {},
    temagrupper: Record<string, string> = {},
): HenvendelseRad[] {
    return henvendelser.map((henvendelse) => ({
        kjedeId: henvendelse.kjedeId,
        sisteMeldingSendt: henvendelse.sisteMeldingSendt,
        tema: dekod(henvendelse.tema, temaer),
        temagruppe: dekod(henvendelse.temagruppe, temagrupper),
        henvendelsestype: henvendelsestypeVisningsnavn(henvendelse.henvendelsestype),
    }));
}

function dekod(kode: string | null | undefined, termPerKode: Record<string, string>): string {
    if (!kode) return "-";
    return termPerKode[kode] ?? kode;
}

export const STANDARD_SORTERING: SortState = { orderBy: "sisteMeldingSendt", direction: "descending" };

/** Henvendelser uten dato havner sist i begge retninger. */
export function sorterHenvendelser(rader: HenvendelseRad[], sort: SortState = STANDARD_SORTERING): HenvendelseRad[] {
    const retning = sort.direction === "ascending" ? 1 : -1;
    return [...rader].sort((a, b) => {
        if (sort.orderBy === "sisteMeldingSendt") {
            const tidA = tidspunkt(a.sisteMeldingSendt);
            const tidB = tidspunkt(b.sisteMeldingSendt);
            if (tidA === undefined && tidB === undefined) return 0;
            if (tidA === undefined) return 1;
            if (tidB === undefined) return -1;
            return retning * (tidA - tidB);
        }
        const felt = sort.orderBy as "temagruppe" | "tema" | "henvendelsestype";
        return retning * a[felt].localeCompare(b[felt], "nb");
    });
}

function tidspunkt(dato?: string | null): number | undefined {
    if (!dato) return undefined;
    const tid = Date.parse(dato);
    return Number.isNaN(tid) ? undefined : tid;
}
