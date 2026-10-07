import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { Vedtakstype } from "@bidrag/api/SakApi";

/** Vedtak fattet i ny løsning regnes alltid som fattet og beregnet, som i Bisys. */
export function erFattetBeregnet(hendelse: SakshendelseDto): boolean {
    return hendelse.fraBbm || Boolean(hendelse.vedtaksid && hendelse.behandlingsid);
}

/** Query-parametre for opprett forsendelse/notat. Samme oppsett som `ForsendelseUrlProvider` i Bisys. */
export function lagForsendelseParams(
    hendelse: SakshendelseDto,
    søknadsid: string,
    enhet: string | null,
    sessionState: string | null,
): URLSearchParams {
    const params = new URLSearchParams({
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
        soknadId: søknadsid,
        ...(hendelse.vedtaksid && { vedtakId: hendelse.vedtaksid }),
        ...(hendelse.behandlingsid && { behandlingId: hendelse.behandlingsid }),
        ...(hendelse.stonadType && { stonadType: hendelse.stonadType }),
        ...(hendelse.engangsbelopType && { engangsbelopType: hendelse.engangsbelopType }),
        ...(hendelse.søknadsgruppe && { behandlingType: hendelse.søknadsgruppe }),
        ...(erFattetBeregnet(hendelse) && { erFattetBeregnet: "true" }),
        ...(hendelse.søktAv && { soknadFra: hendelse.søktAv }),
        ...{ vedtakType: hendelse.vedtakType ?? Vedtakstype.ENDRING },
    });

    hendelse.barnObjektNumre?.forEach((objNr) => {
        params.append("barn_obj_nr", objNr);
    });

    return params;
}
