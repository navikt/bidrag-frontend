import { getBisysSessionParams } from "@bidrag/common";

type BisysSakTarget = "sak" | "soknad";

export function bisysSakUrl(target: BisysSakTarget, saksnummer: string, søk: string) {
    const { sessionState } = getBisysSessionParams(new URLSearchParams(søk));
    const params = new URLSearchParams({ saksnr: saksnummer });
    if (sessionState) params.set("sessionState", sessionState);
    return `/bisys/${target}?${params}`;
}

/** Sender nettleseren til Bisys via `/bisys/:target`-redirecten i apps/web. */
export function gåTilBisys(target: BisysSakTarget, saksnummer: string, nyFane = false) {
    const url = bisysSakUrl(target, saksnummer, window.location.search);
    if (nyFane) {
        window.open(url, "_blank")?.focus();
    } else {
        window.location.href = url;
    }
}
