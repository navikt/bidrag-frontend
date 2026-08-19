import { EndreDokument, Sakstilknytning } from "../../../../types/api/JournalpostTypes";

export interface JournalpostToRegister {
    journalpostId: string;
    journalforendeEnhet: string;
    mottatDato?: string;
    endreDokumenter: EndreDokument[];
    tilknyttSaker?: Sakstilknytning[];
    tittel?: string;
    gjelderIdent: string;
    avsenderNavn?: string;
}
