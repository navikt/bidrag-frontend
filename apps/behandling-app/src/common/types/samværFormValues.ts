import type {
    SamvaerskalkulatorFerietype,
    SamvaerskalkulatorNetterFrekvens,
    Samvaersklasse,
} from "@bidrag/api/BidragBehandlingApiV1";
export interface SamværBarnformvalues {
    [gjelderBarn: string]: Samværformvalues;
}
export interface Samværformvalues {
    perioder: SamværPeriodeFormvalues[];
    begrunnelse: string;
}

export interface SamværPeriodeFormvalues {
    id?: number;
    fom: string;
    tom?: string;
    samværsklasse: Samvaersklasse;
    beregning?: SamværskalkulatorFormValues;
}

export interface SamværskalkulatorFormValues {
    isSaved: boolean;
    regelmessigSamværNetter?: number;
    samværsklasse?: Samvaersklasse;
    gjennomsnittligSamværPerMåned?: number;
    ferier: SamværskalkulatorFerietypeFormValues;
}

export type SamværskalkulatorFerietypeFormValues = {
    [_key in SamvaerskalkulatorFerietype]?: SamværskalkulatorFerieFormValues;
};

export interface SamværskalkulatorFerieFormValues {
    bidragsmottakerNetter: number;
    bidragspliktigNetter: number;
    frekvens: SamvaerskalkulatorNetterFrekvens;
}
