import DokumentValgForsendelse from "../../components/dokument/DokumentValgForsendelse";
import { useSession } from "../forsendelse/context/SessionContext";
import DokumentValgFromQuery from "./DokumentValgFromQuery";

export default function DokumentValgOpprett() {
    const { forsendelseId } = useSession();

    if (forsendelseId) {
        return <DokumentValgForsendelse autoselect />;
    }
    return <DokumentValgFromQuery />;
}
