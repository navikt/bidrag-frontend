export interface PostnummerPoststed {
    [postnummer: string]: string;
}

export interface LandkodeLand {
    [landkode: string]: string;
}

export interface KodeverkResponse {
    betydninger: {
        [kode: string]: KodeverkBetydning[];
    };
}
export interface KodeverkBetydning {
    gyldigFra: string;
    /** @format date */
    gyldigTil: string;
    beskrivelser: {
        [spraak: string]: {
            term: string;
            tekst: string;
        };
    };
}

export interface EnhetInfoResponse {
    enhetId?: string;
    enhetNr: string;
    navn?: string;
    organisasjonsnummer?: string;
    status?: string;
}
