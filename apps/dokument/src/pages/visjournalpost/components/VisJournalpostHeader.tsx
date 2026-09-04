import Header from "../../../common/components/Header";
import { useAppContext } from "../../../store/AppContext";

export default function VisJournalpostHeader() {
    const {
        appState: { journalpostId },
    } = useAppContext();
    return <Header journalpostId={journalpostId} title={"Vis journalpost"} />;
}
