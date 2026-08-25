/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface PersonRequest {
    /** Identen til personen @Deprecated */
    ident?: string;
    /** Identen til personen */
    verdi: string;
}

/** Liste over alle hentede forekomster av sivilstand */
export interface Sivilstand {
    type?: string;
    /** @format date */
    gyldigFraOgMed?: string;
    /** @format date */
    bekreftelsesdato?: string;
}

export interface SivilstandDto {
    /** Liste over alle hentede forekomster av sivilstand */
    sivilstand?: Sivilstand[];
}

export interface NavnFoedselDoedDto {
    /** Gir navn, fødselsdato og fødselsår for angitt person. Fødselsår finnes for alle i PDL, mens noen ikke har utfyllt fødselsdato */
    navn?: string;
    /** @format date */
    foedselsdato?: string;
    /** @format int32 */
    foedselsaar: number;
    /**
     * Eventuell dødsdato til personen
     * @format date
     */
    doedsdato?: string;
}

/** Familieenheter til personen */
export interface MotpartBarnRelasjon {
    forelderrolleMotpart: "BARN" | "FAR" | "MEDMOR" | "MOR";
    motpart?: PersonDto;
    fellesBarn: PersonDto[];
}

export interface MotpartBarnRelasjonDto {
    person: PersonDto;
    /** Familieenheter til personen */
    personensMotpartBarnRelasjon: MotpartBarnRelasjon[];
}

export interface PersonDto {
    /** Identen til personen */
    ident: string;
    /** Navn til personen, format <Etternavn, Fornavn Middelnavn> */
    navn?: string;
    /** Fornavn til personen */
    fornavn?: string;
    /** Mellomnavn til personen */
    mellomnavn?: string;
    /** Etternavn til personen */
    etternavn?: string;
    /** Kjønn til personen */
    kjoenn?: "KVINNE" | "MANN" | "UKJENT";
    /**
     * Dødsdato til personen
     * @format date
     */
    doedsdato?: string;
    /**
     * Fødselsdato til personen
     * @format date
     */
    foedselsdato?: string;
    /** Diskresjonskode (personvern) */
    diskresjonskode?: string;
    /** Aktør id til personen */
    aktoerId?: string;
    /**
     * Kortnavn på personen, navn som benyttes ved maskinelle utskrifter (maks 40 tegn)
     * @deprecated
     */
    kortNavn?: string;
    /** Kortnavn på personen, navn som benyttes ved maskinelle utskrifter (maks 40 tegn) */
    kortnavn?: string;
}

/** Periodiser liste over husstander og dens medlemmer i perioden */
export interface Husstand {
    /** @format date */
    gyldigFraOgMed?: string;
    /** @format date */
    gyldigTilOgMed?: string;
    adressenavn?: string;
    husnummer?: string;
    husbokstav?: string;
    bruksenhetsnummer?: string;
    postnummer?: string;
    bydelsnummer?: string;
    kommunenummer?: string;
    /** @format int64 */
    matrikkelId?: number;
    husstandsmedlemListe: Husstandsmedlem[];
}

export interface Husstandsmedlem {
    /** @format date */
    gyldigFraOgMed?: string;
    /** @format date */
    gyldigTilOgMed?: string;
    personId?: string;
    fornavn?: string;
    mellomnavn?: string;
    etternavn?: string;
    /** @format date */
    foedselsdato?: string;
    /** @format date */
    doedsdato?: string;
}

export interface HusstandsmedlemmerDto {
    /** Periodiser liste over husstander og dens medlemmer i perioden */
    husstandListe?: Husstand[];
}

export interface PersonIdent {
    verdi: string;
    erDNummer: boolean;
    erNAVSyntetisk: boolean;
    erSkattSyntetisk: boolean;
    /** @format date */
    fødselsdato: string;
}

export interface Graderingsinfo {
    /** Map med ident til gradering. */
    identerTilGradering: Record<string, "STRENGT_FORTROLIG" | "FORTROLIG" | "STRENGT_FORTROLIG_UTLAND" | "UGRADERT">;
    /** Hvor vidt hovedident fra GraderingQuery er skjerment. */
    identerTilSkjerming: Record<string, boolean>;
}

export interface Fodselsdatoer {
    /** Map med ident til fødselsdato-elementer. */
    identerTilDatoer: Record<string, string>;
}

export interface GeografiskTilknytningDto {
    /** Identen til personen */
    ident: string;
    /** Aktørid til personen */
    aktoerId?: string;
    /** Geografisk tilknytning til personen */
    geografiskTilknytning?: string;
    /** Om geografisk tilknytning til personen er utlandet. Geografisktilknytning feltet vil da ha landkode istedenfor kommune/bydel nummer */
    erUtland: boolean;
    /** Diskresjonskode (personvern) */
    diskresjonskode?: string;
}

/** Liste over alle hentede forekomster av foreldre-barnrelasjoner */
export interface ForelderBarnRelasjon {
    minRolleForPerson: "BARN" | "FAR" | "MEDMOR" | "MOR";
    relatertPersonsIdent?: string;
    relatertPersonsRolle: "BARN" | "FAR" | "MEDMOR" | "MOR";
}

export interface ForelderBarnRelasjonDto {
    /** Liste over alle hentede forekomster av foreldre-barnrelasjoner */
    forelderBarnRelasjon?: ForelderBarnRelasjon[];
}

export interface PersonAdresseDto {
    /** Gyldige adressetyper: BOSTEDSADRESSE, KONTAKTADRESSE, eller OPPHOLDSADRESSE */
    adressetype: "BOSTEDSADRESSE" | "KONTAKTADRESSE" | "OPPHOLDSADRESSE" | "DELT_BOSTED";
    /** Adresselinje 1 */
    adresselinje1?: string;
    /** Adresselinje 2 */
    adresselinje2?: string;
    /** Adresselinje 3 */
    adresselinje3?: string;
    /** Bruksenhetsnummer */
    bruksenhetsnummer?: string;
    /** Postnummer, tilgjengelig hvis norsk adresse */
    postnummer?: string;
    /** Poststed, tilgjengelig hvis norsk adresse */
    poststed?: string;
    /** To-bokstavers landkode ihht iso3166-1 alfa-2 */
    land: string;
    /** Trebokstavs landkode ihht iso3166-1 alfa-3 */
    land3: string;
}
