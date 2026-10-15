import { getBisysSessionParams } from "@bidrag/common";
import { useFlag } from "@unleash/proxy-client-react";
import { useRouteLoaderData, useSearchParams } from "react-router";
import { RETUR_PARAM, SAKSNR_PARAM } from "~/common/navigation/returLink.ts";
import type { loader } from "~/root.tsx";

export interface BidragLenke {
    href: string;
    ekstern: boolean;
}

type BisysEndepunkt = "Sak.do" | "Brukeroversikt.do";
type BisysParameter = "saksnr" | "ident";

/**
 * Bygger lenker til sak- og brukeroversikt, enten i ny løsning eller i Bisys, styrt av feature-flagg.
 * Lenkene leser Bisys-sesjonen fra `sessionStorage`, så de må bare rendres på klienten.
 * Bisys-lenkene er `undefined` når Bisys-URL-en mangler.
 */
export function useBidragLenker() {
    const nySakside = useFlag("bisys.ny_sakside");
    const nyBrukeroversikt = useFlag("bisys.ny_brukeroversikt");
    const bisysUrl = useRouteLoaderData<typeof loader>("root")?.bisysUrl;
    const [gjeldendeSøkeparametre] = useSearchParams();

    function lagBisysLenke(endepunkt: BisysEndepunkt, søkeparametre: URLSearchParams) {
        if (!bisysUrl) return undefined;

        const baseUrl = new URL(bisysUrl);
        if (!baseUrl.pathname.endsWith("/")) baseUrl.pathname += "/";
        const url = new URL(endepunkt, baseUrl);
        url.search = lagSøkestreng(søkeparametre);
        return { href: url.toString(), ekstern: true } satisfies BidragLenke;
    }

    function bisysLenke(endepunkt: BisysEndepunkt, parameter: BisysParameter, verdi: string) {
        const søkeparametre = new URLSearchParams(gjeldendeSøkeparametre);
        for (const navn of ["saksnr", "ident", RETUR_PARAM, SAKSNR_PARAM]) søkeparametre.delete(navn);
        søkeparametre.set(parameter, verdi);
        leggTilBisysSesjon(søkeparametre);
        return lagBisysLenke(endepunkt, søkeparametre);
    }

    function internLenke(sti: string): BidragLenke {
        const søkeparametre = new URLSearchParams();
        leggTilBisysSesjon(søkeparametre);
        return { href: `${sti}${lagSøkestreng(søkeparametre)}`, ekstern: false };
    }

    function leggTilBisysSesjon(søkeparametre: URLSearchParams) {
        const { sessionState, enhet } = getBisysSessionParams(gjeldendeSøkeparametre);
        if (sessionState !== null) søkeparametre.set("sessionState", sessionState);
        if (enhet !== null) søkeparametre.set("enhet", enhet);
    }

    function bisysSakLenke(saksnummer: string) {
        return bisysLenke("Sak.do", "saksnr", saksnummer);
    }

    function bisysBrukerLenke(obfuskertIdent: string) {
        const søkeparametre = new URLSearchParams();
        const { sessionState } = getBisysSessionParams(gjeldendeSøkeparametre);
        if (sessionState !== null) søkeparametre.set("sessionState", sessionState);
        søkeparametre.set("ident", obfuskertIdent);
        return lagBisysLenke("Brukeroversikt.do", søkeparametre);
    }

    function sakLenke(saksnummer: string) {
        return nySakside ? internLenke(`/sak/${saksnummer}`) : bisysSakLenke(saksnummer);
    }

    function brukerLenke(obfuskertIdent: string) {
        return nyBrukeroversikt ? internLenke(`/bruker/${obfuskertIdent}`) : bisysBrukerLenke(obfuskertIdent);
    }

    return { sakLenke, brukerLenke, bisysSakLenke, bisysBrukerLenke };
}

function lagSøkestreng(søkeparametre: URLSearchParams): string {
    const søkestreng = søkeparametre.toString();
    return søkestreng ? `?${søkestreng}` : "";
}
