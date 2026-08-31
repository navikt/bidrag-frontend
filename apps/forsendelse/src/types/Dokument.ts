import type { DokumentArkivSystemDto, DokumentDto } from "@bidrag/api/BidragForsendelseApi";
import type { RolleType } from "@bidrag/common";
import type { DokumentStatus } from "../constants/DokumentStatus";

export interface IDokument extends Omit<DokumentDto, "status"> {
    index: number;
    journalpostId?: string;
    erSkjema?: boolean;
    dokumentreferanse?: string;
    arkivsystem?: DokumentArkivSystemDto;
    lenkeTilDokumentreferanse?: string;
    /** Originale dokumentreferanse hvis er kopi av en ekstern dokument (feks fra JOARK) */
    originalDokumentreferanse?: string;
    /** Originale journalpostid hvis er kopi av en ekstern dokument (feks fra JOARK) */
    originalJournalpostId?: string;
    forsendelseId?: string;
    dokumentmalId?: string;
    språk?: string;
    tittel: string;
    dokumentDato?: string;
    status?: DokumentStatus;
    gammelStatus?: DokumentStatus;
    fraSaksnummer?: string;
    fraRolle?: RolleType;
    lagret: boolean;
}
