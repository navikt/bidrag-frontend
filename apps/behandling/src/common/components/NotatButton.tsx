import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Link } from "@navikt/ds-react";
import text from "../constants/texts";
import { useBehandlingProvider } from "../context/BehandlingContext";

export default function NotatButton({ label = text.label.notatButton }: { label?: string }) {
    const { behandlingId, vedtakId, saksnummer } = useBehandlingProvider();
    const notatUrl = behandlingId ? `/behandling/${behandlingId}/notat` : vedtakId ? `/vedtak/${vedtakId}/notat` : "";
    return (
        <Link href={saksnummer ? `/sak/${saksnummer}${notatUrl}` : notatUrl} target="_blank" className="font-ax-bold">
            {label} <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
