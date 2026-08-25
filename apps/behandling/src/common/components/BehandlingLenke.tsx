import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";

export default function BehandlingLenke({ id, saksnummer }: { id: number; saksnummer: string }) {
    return (
        <Link variant="action" href={`/sak/${saksnummer}/behandling/${id}`} target="_blank">
            <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
