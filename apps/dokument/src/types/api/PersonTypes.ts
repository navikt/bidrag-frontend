export type PersonResponse = PersonDto;

export interface PersonDto {
    diskresjonskode?: string;
    doedsdato?: string;
    ident: string;
    aktoerId?: string;
    navn?: string;
    kortnavn?: string;
    visningsnavn?: string;
}

export interface PersonAdresseDto {
    adressetype?: AdresseType;
    adresselinje1: string;
    adresselinje2?: string;
    adresselinje3?: string;
    postnummer: string;
    poststed: string;
    land: string;
}

export enum AdresseType {
    NORSK_POSTADRESSE = "NORSK_POSTADRESSE",
    UTENLANDSK_POSTADRESSE = "UTENLANDSK_POSTADRESSE",
}
