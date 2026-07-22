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
    kanAapnes: boolean;
    aapenForklaring?: string;
    gjelderAktor?: JournalpostDto["gjelderAktor"];
}

export interface PdfState {
    loading: boolean;
    src?: string;
    error?: string;
    pageCount?: number;
}
