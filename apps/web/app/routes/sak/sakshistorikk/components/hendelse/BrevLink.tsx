import type { SakshendelseDto } from "@bidrag/api/SakApi";
import { EnvelopeOpenIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";
import { lagForsendelseParams } from "./forsendelseParams";

type Props = {
    saksnummer: string;
    hendelse: SakshendelseDto;
    enhet: string | null;
    sessionState: string | null;
    kanSkrive: boolean;
};

export function BrevLink({ saksnummer, hendelse, enhet, sessionState, kanSkrive }: Props) {
    if (!kanSkrive || !hendelse.søknadsid) return null;

    const params = lagForsendelseParams(hendelse, hendelse.søknadsid, enhet, sessionState);

    return (
        <Link
            href={`/sak/${saksnummer}/forsendelse/?${params}`}
            aria-label="Opprett forsendelse"
            title="Opprett forsendelse"
        >
            <EnvelopeOpenIcon aria-hidden />
        </Link>
    );
}
