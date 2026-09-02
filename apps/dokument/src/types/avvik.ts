import type { DistribuerTilAdresse } from "@bidrag/api/BidragDokumentApi";
import type { AvvikType } from "./api/AvvikTypes";
import type { DokumentDto } from "./api/JournalpostTypes";

export type Avvik =
    | FarskapUtelukket
    | BestillOriginal
    | BestillReskanning
    | BestillSplitting
    | EndreFagomrade
    | FeilforeSak
    | InngaendeTilUtgaendeDokument
    | SlettJournalpost
    | TrekkJournalpost
    | RegistrerRetur
    | SendTilFagomrade
    | KopierFraAnnenFagomrade
    | ManglerAdresse
    | BestillNyDistribusjon
    | OverforTilAnnenEnhet;

interface FarskapUtelukket {
    type: AvvikType.FARSKAP_UTELUKKET;
}

interface ManglerAdresse {
    type: AvvikType.MANGLER_ADRESSE;
}
interface BestillNyDistribusjon {
    type: AvvikType.BESTILL_NY_DISTRIBUSJON;
    adresse: DistribuerTilAdresse;
}

interface BestillOriginal {
    type: AvvikType.BESTILL_ORIGINAL;
    enhetsnummer: string;
}

interface RegistrerRetur {
    type: AvvikType.REGISTRER_RETUR;
    beskrivelse: string;
    returDato: string;
}

interface BestillReskanning {
    type: AvvikType.BESTILL_RESKANNING;
    beskrivelse: string;
}

interface BestillSplitting {
    type: AvvikType.BESTILL_SPLITTING;
    beskrivelse: string;
}

interface EndreFagomrade {
    type: AvvikType.ENDRE_FAGOMRADE;
    fagomrade: string;
    bekreftetSendtScanning?: boolean;
}

interface SendTilFagomrade {
    type: AvvikType.SEND_TIL_FAGOMRADE;
    fagomrade: string;
    dokumenter?: string;
}

export interface FeilforeSak {
    type: AvvikType.FEILFORE_SAK;
    saksnummer: string;
}

interface InngaendeTilUtgaendeDokument {
    type: AvvikType.INNG_TIL_UTG_DOKUMENT;
}

interface SlettJournalpost {
    type: AvvikType.SLETT_JOURNALPOST;
}

interface TrekkJournalpost {
    type: AvvikType.TREKK_JOURNALPOST;
    beskrivelse: string;
}

export interface OverforTilAnnenEnhet {
    type: AvvikType.OVERFOR_TIL_ANNEN_ENHET;
    nyttEnhetsnummer: string;
    gammeltEnhetsnummer: string;
}

export interface KopierFraAnnenFagomrade {
    type: AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE;
    relevanteDokumenter: DokumentDto[];
    knyttTilSaker: string[];
}
