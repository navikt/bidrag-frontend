export interface GeografiskTilknytningDODto {
    kode: string;
    type: GtType;
}

export interface PersonGeografiskTilknytningDto {
    diskresjonskode: string;
    geografiskTilknytning: GeografiskTilknytningDODto;
}

export interface PersonInfoDto extends PersonGeografiskTilknytningDto {
    navn: string;
    fornavn: string;
    kortnavn: string;
    visningsnavn: string;
    kjonn: string;
    fodtDato: string;
    isDod: boolean;
    dodsDato: string;
    isKode6: boolean;
    isDiskresjon: boolean;
    bostedsland: string;
    kommunenr: string;
    ident: string;
    isUtgattIdent: boolean;
    identFormatert: string;
    identtype: FolkeregisteridentifikatorType;
}

export interface PersonFamilierelasjonerResponse {
    person: PersonInfoDto;
    personensMor: PersonInfoDto | undefined | null;
    personensFar: PersonInfoDto | undefined | null;
    personensFamilieenheter: FamileenhetDto[];
}

export interface FamileenhetDto {
    forelderrolleMotpart: ForelderrolleType;
    motpart: PersonInfoDto | undefined | null;
    fellesBarn: PersonInfoDto[];
}

export enum ForelderrolleType {
    FAR = "FAR",
    MOR = "MOR",
    BARN = "BARN",
}

export enum RelasjonType {
    FAR = "FAR",
    MOR = "MOR",
    BARN = "BARN",
}

export enum GtType {
    KOMMUNE = "KOMMUNE",
    BYDEL = "BYDEL",
    UTLAND = "UTLAND",
    UDEFINERT = "UDEFINERT",
}

export enum FolkeregisteridentifikatorType {
    DNR = "DNR",
    FNR = "FNR",
}
