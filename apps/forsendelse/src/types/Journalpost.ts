import type { DokumentDto, JournalpostDto } from "@bidrag/api/BidragDokumentApi";

export function journalstatusToDisplayValue(journalstatus: string) {
    switch (journalstatus) {
        case IJournalpostStatus.UNDER_PRODUKSJON:
            return "Under prod.";
        case IJournalpostStatus.DISTRIBUERT:
            return "Distribuert";
        case IJournalpostStatus.JOURNALFØRT:
            return "Journalført";
        case IJournalpostStatus.KLAR_FOR_DISTRIBUSJON:
            return "Klar for distribusjon";
        case IJournalpostStatus.UNDER_OPPRETELSE:
            return "Under opprettelse";
    }

    return journalstatus;
}

export enum IJournalpostStatus {
    UNDER_OPPRETELSE = "UO",
    UNDER_PRODUKSJON = "D",
    RESERVERT = "R",
    JOURNALFØRT = "J",
    DISTRIBUERT = "E",
    KLAR_FOR_DISTRIBUSJON = "KP",
}
export interface IJournalpost extends JournalpostDto {
    journalpostIdNoPrefix: string;
    erForsendelse: boolean;
    dokumenter: IDokumentJournalDto[];
}
export interface IDokumentJournalDto extends DokumentDto {
    originalJournalpostId?: string;
    originalDokumentreferanse?: string;
}

export enum FAGOMRADE {
    BID = "BID",
    FAR = "FAR",
}

export function isFagomradeBidrag(fagomrade: string) {
    return fagomrade === FAGOMRADE.BID || fagomrade === FAGOMRADE.FAR;
}
