import type { DokumentStatusDto, JournalpostDto, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";

export interface SaksDokument {
    id: string;
    journalpostId: string;
    journalpostStatus?: JournalpostStatus | null;
    journalpostTittel?: string;
    journalfortDato?: string;
    dokumentreferanse?: string;
    dokumentStatus?: DokumentStatusDto | null;
    dokumentType?: string;
    dokumentDato?: string;
    tittel: string;
    kanÅpnes: boolean;
    åpenForklaring?: string;
    gjelderAktor?: JournalpostDto["gjelderAktor"];
}
