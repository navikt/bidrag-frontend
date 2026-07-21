import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { NotePencilIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";

type Props = {
    saksnummer: string;
    hendelse: SakshendelseDto;
    enhet: string | null;
    sessionState: string | null;
    kanSkrive: boolean;
};

export function NotatLink({ saksnummer, hendelse, enhet, sessionState, kanSkrive }: Props) {
    if (!kanSkrive || !hendelse.søknadsid) return null;

    const params = new URLSearchParams({
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
        soknadId: hendelse.søknadsid,
        ...(hendelse.vedtaksid && { vedtakId: hendelse.vedtaksid }),
        ...(hendelse.behandlingsid && { behandlingId: hendelse.behandlingsid }),
        ...(hendelse.stonadType && { stonadType: hendelse.stonadType }),
        ...(hendelse.engangsbelopType && {
            engangsbelopType: hendelse.engangsbelopType,
        }),
        ...(hendelse.fraBbm && { erFattetBeregnet: String(hendelse.fraBbm) }),
        ...(hendelse.søktAv && { soknadFra: hendelse.søktAv }),
        ...(hendelse.vedtakType && { vedtakType: hendelse.vedtakType }),
    });

    hendelse.barnObjektNumre?.forEach((objNr) => {
        params.append("barn_obj_nr", objNr);
    });

    return (
        <Link href={`/sak/${saksnummer}/notat/?${params}`} title="Notat">
            <NotePencilIcon aria-hidden />
        </Link>
    );
}
