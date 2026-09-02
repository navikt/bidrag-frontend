export type EnhetResponse = EnhetDto;

export interface EnhetDto {
    enhetIdent: string;
    enhetNavn?: string;
    enhetType?: EnhetType;
}

export interface EnhetInfoResponse {
    enhetId?: string;
    enhetNr: string;
    navn?: string;
    organisasjonsnummer?: string;
    status?: string;
}

export enum EnhetType {
    KLAGE = "Klage",
    FORVALTNING = "Forvaltning",
    SPESIALENHETER = "Spesialenheter",
}
