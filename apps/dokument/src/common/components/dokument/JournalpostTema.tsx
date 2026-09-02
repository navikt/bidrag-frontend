import type { Journalpost } from "../../../types/journalpost";
import SimpleTextField from "../fields/SimpleTextField";

interface JournalpostKildeProps {
    journalpost: Journalpost;
}

export default function JournalpostTema({ journalpost }: JournalpostKildeProps) {
    function getTema() {
        switch (journalpost.fagomrade) {
            case "FAR":
                return "Foreldreskap";
            case "BID":
                return "Bidrag";
            default:
                return journalpost.fagomrade;
        }
    }
    return (
        <div className={"journalpost-kilde"}>
            <SimpleTextField label={"Fagområde"} value={getTema()} />
        </div>
    );
}
