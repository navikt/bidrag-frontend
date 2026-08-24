import { useParams } from "react-router";
import { BehandlingPage } from "../BehandlingPage";

/**
 * Rute for behandling. Samme komponent brukes både for behandling og for
 * lesemodus av et vedtak, avhengig av hvilken parameter som finnes i URLen.
 */
export default function BehandlingRoute() {
    const { behandlingId, vedtaksid } = useParams<{ behandlingId?: string; vedtaksid?: string }>();
    return <BehandlingPage behandlingId={behandlingId} vedtakId={vedtaksid} />;
}
