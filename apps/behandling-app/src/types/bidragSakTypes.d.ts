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

export interface OpprettSakRequest {
    /** Sakens eierfogd (enhetsnummeret som får tilgang til saken. */
    eierfogd: string;
    kategori: "Nasjonal" | "Utland";
    ansatt: boolean;
    inhabilitet: boolean;
    levdeAdskilt: boolean;
    paragraf19: boolean;
    /** Kovensjonskode tilsvarende kodene i T_KODE_KONVENSJON. */
    konvensjon?:
        | "Annet - iSupport"
        | "Haag 2007 - iSupport"
        | "Haag"
        | "Lugano"
        | "Nordisk innkreving"
        | "New York"
        | "USA-avtalen"
        | "Haag 1973"
        | "Ingen";
    /** @format date */
    konvensjonsdato?: string;
    ffuReferansenr?: string;
    land?: string;
    /** @uniqueItems true */
    roller: RolleDto[];
}

export interface RolleDto {
    fodselsnummer?: string;
    /** Kode for rolletype tilsvarende kodene i T_KODE_ROLLETYPE. */
    type: "BA" | "BM" | "BP" | "FR" | "RM";
    objektnummer?: string;
    reellMottager?: string;
    mottagerErVerge: boolean;
    samhandlerIdent?: string;
    foedselsnummer?: string;
    rolleType: "BA" | "BM" | "BP" | "FR" | "RM";
}

export interface OpprettSakResponse {
    saksnummer: string;
}

export interface OppdaterSakRequest {
    saksnummer: string;
    status?: "AK" | "IN" | "NY" | "SA" | "SO";
    ansatt?: boolean;
    inhabilitet?: boolean;
    levdeAdskilt?: boolean;
    paragraf19?: boolean;
    /** @format date */
    sanertDato?: string;
    arbeidsfordeling?: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
    kategorikode?: "Nasjonal" | "Utland";
    landkode?: string;
    konvensjonskode?:
        | "Annet - iSupport"
        | "Haag 2007 - iSupport"
        | "Haag"
        | "Lugano"
        | "Nordisk innkreving"
        | "New York"
        | "USA-avtalen"
        | "Haag 1973"
        | "Ingen";
    /** @format date */
    konvensjonsdato?: string;
    ffuReferansenr?: string;
    /** @uniqueItems true */
    roller: RolleDto[];
}

export interface OppdaterSakResponse {
    saksnummer: string;
    eierfogd: string;
    kategorikode: "Nasjonal" | "Utland";
    status: "AK" | "IN" | "NY" | "SA" | "SO";
    ansatt: boolean;
    inhabilitet: boolean;
    levdeAdskilt: boolean;
    paragraf19: boolean;
    /** @format date */
    sanertDato?: string;
    arbeidsfordeling: "BBF" | "EEN" | "EFS" | "FRS" | "INH" | "OPS";
    landkode?: string;
    konvensjonskode?:
        | "Annet - iSupport"
        | "Haag 2007 - iSupport"
        | "Haag"
        | "Lugano"
        | "Nordisk innkreving"
        | "New York"
        | "USA-avtalen"
        | "Haag 1973"
        | "Ingen";
    /** @format date */
    konvensjonsdato?: string;
    ffuReferansenr?: string;
    roller: RolleDto[];
}

/** Data som trengs for å opprette et saksnummer for en bidragssak */
export interface NySakCommandDto {
    /** Sakens eierfogd (enhetsnummeret som får tilgang til saken */
    eierfogd: string;
}

/** Response ved opprettelse av sak */
export interface NySakResponseDto {
    /** Saksnummer som ble tildelt  */
    saksnummer: string;
}

export interface FinnPersonRequest {
    ident: string;
}

/** Metadata for en bidragssak */
export interface BidragSakDto {
    /** Eierfogd for bidragssaken */
    eierfogd: string;
    /** Saksnummeret til bidragssaken */
    saksnummer: string;
    /** Saksstatus til bidragssaken */
    saksstatus: "AK" | "IN" | "NY" | "SA" | "SO";
    /** Kategorikode: 'N' eller 'U' */
    kategori: "Nasjonal" | "Utland";
    /** Om saken omhandler paragraf 19 */
    erParagraf19: boolean;
    /** Om saken inneholder personer med diskresjonskode */
    begrensetTilgang: boolean;
    /** Rollene som saken inneholder */
    roller: RolleDto[];
}

/** Metadata for pip tjeneste (paragraf 19 på bidragssak, samt fnr for involverte roller */
export interface BidragSakPipDto {
    /** Saksnummeret til bidragssaken */
    saksnummer: string;
    /** Om saken omhandler paragraf 19 */
    erParagraf19: boolean;
    /** Fødselsnummer til personer innvolvert i bidragssaken */
    roller: string[];
}
