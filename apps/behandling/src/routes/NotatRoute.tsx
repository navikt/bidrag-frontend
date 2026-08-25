import { useParams } from "react-router";
import NotatPage from "../forskudd/pages/notat/NotatPage";

export default function NotatRoute() {
    const { behandlingId, vedtakId } = useParams<{ behandlingId?: string; vedtakId?: string }>();
    return <NotatPage behandlingId={behandlingId} vedtakId={vedtakId} />;
}
