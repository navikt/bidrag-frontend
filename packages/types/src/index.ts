export type Saksnummer = string;
export type Fnr = string;

export interface Sak {
    saksnummer: Saksnummer;
    sakType: SakType;
    status: SakStatus;
    opprettetDato: string;
}

export type SakType = "BIDRAG" | "FORSKUDD" | "SÆRBIDRAG";
export type SakStatus = "AKTIV" | "AVSLUTTET" | "UNDER_BEHANDLING";

export interface Forsendelse {
    forsendelseId: string;
    saksnummer: Saksnummer;
    tittel: string;
    status: ForsendelseStatus;
    opprettetDato: string;
}

export type ForsendelseStatus = "UNDER_PRODUKSJON" | "FERDIGSTILT" | "AVBRUTT";

export interface Dokument {
    dokumentId: string;
    tittel: string;
    dokumentType: string;
    opprettetDato: string;
}

export interface ApiError {
    status: number;
    message: string;
    detail?: string;
}
