import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { Link } from "@navikt/ds-react";

type Props = {
    saksnummer: string;
    hendelse: SakshendelseDto;
    enhet: string | null;
    sessionState: string | null;
    kanSkrive: boolean;
};

export function BehandleLink({
    saksnummer,
    hendelse,
    enhet,
    sessionState,
    kanSkrive,
}: Props) {
    if (!kanSkrive) return null;

    const params = new URLSearchParams({
        saksnr: saksnummer,
        ...(enhet && { enhet }),
        ...(sessionState && { sessionState }),
        ...(hendelse.søknadsid && { soknid: hendelse.søknadsid }),
    });

    if (hendelse.erKlageberettigetVedtak) {
        if (!hendelse.hendelseId) return null;
        params.set("executeKlage", hendelse.hendelseId);
        return <Link href={`/bisys/sakHistorikk?${params}`}>Lag klage</Link>;
    }

    if (hendelse.erLukket) return null;

    params.set("executeSoknad", "1");
    return <Link href={`/bisys/sakHistorikk?${params}`}>Søknad</Link>;
}
