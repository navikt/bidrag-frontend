import { useParams } from "react-router";
import NotatPage from "../forskudd/pages/notat/NotatPage";

export default function NotatRoute() {
    const { behandlingId, vedtaksid } = useParams<{ behandlingId?: string; vedtaksid?: string }>();
    return <NotatPage behandlingId={behandlingId} vedtakId={vedtaksid} />;
}
