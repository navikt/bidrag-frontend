import type {
    Bostatuskode,
    BostatusperiodeDto,
    HusstandsmedlemDtoV2,
    SivilstandDto,
    SivilstandGrunnlagDto,
    Sivilstandskode,
} from "@bidrag/api/BidragBehandlingApiV1";

export interface SivilstandBeregnetInnhold {
    periodeFom?: string;
    periodeTom?: string;
    sivilstandskode: Sivilstandskode;
}

export interface BoforholdFormValues {
    husstandsmedlem?: HusstandsmedlemDtoV2[];
    sivilstand?: SivilstandDto[];
    begrunnelse?: string;
    andreVoksneIHusstanden?: BostatusperiodeDto[];
}

export interface HusstandOpplysningPeriode {
    fraDato: Date;
    tilDato: Date;
    bostatus: Bostatuskode;
}

export interface HusstandOpplysningFraFolkeRegistre {
    foedselsdato?: string;
    ident: string;
    navn: string;
    perioder: HusstandOpplysningPeriode[];
}

export interface SavedOpplysningFraFolkeRegistrePeriode {
    fraDato: string;
    tilDato: string;
    bostatus: Bostatuskode;
}

export interface SavedHustandOpplysninger {
    foedselsdato?: string;
    ident: string;
    navn: string;
    perioder: SavedOpplysningFraFolkeRegistrePeriode[];
}

export interface SivilstandOpplysninger {
    datoFom: string;
    datoTom: string;
    sivilstand: Sivilstandskode;
}

export interface BoforholdOpplysninger {
    husstand: HusstandOpplysningFraFolkeRegistre[];
    sivilstand: SivilstandGrunnlagDto[];
}

export interface ParsedBoforholdOpplysninger {
    husstand: SavedHustandOpplysninger[];
    sivilstand: SivilstandGrunnlagDto[];
}
