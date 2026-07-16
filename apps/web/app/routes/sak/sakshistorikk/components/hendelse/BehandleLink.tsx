import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { Link } from "@navikt/ds-react";

type Props = {
    saksnummer: string;
    hendelse: SakshendelseDto;
    bisysUrl: string;
    enhet: string | null;
    sessionState: string | null;
    kanSkrive: boolean;
};

export function BehandleLink({
    saksnummer,
    hendelse,
    bisysUrl,
    enhet,
    sessionState,
    kanSkrive,
}: Props) {
    if (!kanSkrive || !bisysUrl) return undefined;

    const params = new URLSearchParams({
        saksnr: saksnummer,
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
        ...(hendelse.søknadsid && { soknid: hendelse.søknadsid }),
    });

    if (hendelse.erKlageberettigetVedtak) {
        if (!hendelse.hendelseId) return undefined;
        params.set("executeKlage", hendelse.hendelseId);
        return (
            <Link href={`${bisysUrl}Sakshistorikk.do?${params}`}>
                Lag klage
            </Link>
        );
    }

    if (hendelse.erLukket) return undefined;

    params.set("executeSoknad", "1");
    return <Link href={`${bisysUrl}Sakshistorikk.do?${params}`}>Søknad</Link>;
}
