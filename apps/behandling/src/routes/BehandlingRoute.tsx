import { useParams } from "react-router";
import { BehandlingPage } from "../BehandlingPage";

/**
 * Rute for behandling. Samme komponent brukes både for behandling og for
 * lesemodus av et vedtak, avhengig av hvilken parameter som finnes i URLen.
 */
export default function BehandlingRoute() {
    const { behandlingId, vedtakId } = useParams<{ behandlingId?: string; vedtakId?: string }>();
    return <BehandlingPage behandlingId={behandlingId} vedtakId={vedtakId} />;
}
