export enum AvvikType {
    ENDRE_FAGOMRADE = "ENDRE_FAGOMRADE",
    FEILFORE_SAK = "FEILFORE_SAK",
    SLETT_JOURNALPOST = "SLETT_JOURNALPOST",
    TREKK_JOURNALPOST = "TREKK_JOURNALPOST",
    OVERFOR_TIL_ANNEN_ENHET = "OVERFOR_TIL_ANNEN_ENHET",
}
export type Avvik = EndreFagomrade | FeilforeSak | SlettJournalpost | TrekkJournalpost | OverforTilAnnenEnhet;

interface EndreFagomrade {
    type: AvvikType.ENDRE_FAGOMRADE;
    fagomrade: string;
}

export interface FeilforeSak {
    type: AvvikType.FEILFORE_SAK;
    saksnummer: string;
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
