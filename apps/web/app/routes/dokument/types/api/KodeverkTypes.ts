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
    beskrivelser: {
        [spraak: string]: {
            term: string;
            tekst: string;
        };
    };
}
