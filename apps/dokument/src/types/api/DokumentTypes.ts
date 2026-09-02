export type DokumentUrl = string;
export interface DokumentTilgangResponse {
    dokumentUrl: DokumentUrl;
}

export interface DokumentMetadata {
    format: DokumentFormat;
    status: string;
    journalpostId: string;
    dokumentreferanse: string;
}

export enum DokumentFormat {
    MBDOK = "MBDOK",
    PDF = "PDF",
    HTML = "HTML",
}
