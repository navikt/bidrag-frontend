import { useParams } from "react-router";
import BegrunnelsePage from "../common/pages/BegrunnelsePage";

export default function BegrunnelseRoute() {
    const { behandlingId, broadcastChannel } = useParams<{ behandlingId?: string; broadcastChannel?: string }>();
    return <BegrunnelsePage behandlingId={behandlingId} broadcastChannel={broadcastChannel} />;
}
