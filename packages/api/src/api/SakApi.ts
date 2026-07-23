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

export interface SamhandlerSakerRequestDto {
  samhandlerId: string;
}

export interface SamhandlerSakerDto {
  /** @format int32 */
  antallSaker: number;
  saksnummere: string[];
}

/** @default null */
export enum Arbeidsfordeling {
  BBF = "BBF",
  EEN = "EEN",
  EFS = "EFS",
  FRS = "FRS",
  INH = "INH",
  OPS = "OPS",
  RKS = "RKS",
}

export interface OpprettSakRequest {
  /**
   * Sakens eierfogd (enhetsnummeret som får tilgang til saken).
   * @default ""
   */
  eierfogd: string;
  kategori: "U" | "N";
  ansatt: boolean;
  inhabilitet: boolean;
  levdeAdskilt: boolean;
  /**
   * Kovensjonskode tilsvarende kodene i T_KODE_KONVENSJON.
   * @default ""
   */
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
  konvensjonsdato?: string | null;
  ffuReferansenr?: string | null;
  land?: string | null;
  arbeidsfordeling: Arbeidsfordeling;
  /**
   * Rollene som skal opprettes i saken. Hvis BM mangler, må alle barn (BA) ha reell mottaker (RM).
   * @uniqueItems true
   * @default ""
   */
  roller: RolleDto[];
}

export interface ReellMottakerDto {
  ident: string;
  verge: boolean;
}

export interface RolleDto {
  /**
   * Personens fødselsnummer. Påkrevd for alle
   * @default ""
   */
  fodselsnummer?: string;
  /**
   * Kode for rolletype tilsvarende kodene i T_KODE_ROLLETYPE. Gyldige verdier er f.eks. BM (bidragsmottaker), BP (bidragspliktig) og BA (barn).
   * @default ""
   */
  type: Rolletype;
  /**
   * Internt felt som identifiserer objektet i fagsystemet. Brukes ikke eksternt og skal normalt ikke sendes inn.
   * @deprecated
   * @default ""
   */
  objektnummer?: string | null;
  /**
   * Tidligere brukt felt for reell mottaker. Erstattes av 'reellMottaker'.
   * @deprecated
   * @default ""
   */
  reellMottager?: string | null;
  reellMottaker?: ReellMottakerDto | null;
  /**
   * Angir om mottaker samtidig er verge for barnet. Settes til true dersom mottaker også er verge.
   * @default false
   */
  mottagerErVerge: boolean;
  /**
   * Tidligere brukt felt for fødselsnummer. Erstattes av 'fødselsnummer'.
   * @deprecated
   * @default ""
   */
  foedselsnummer?: string | null;
  /**
   * Tidligere brukt felt for rolletype. Erstattes av 'type'.
   * @deprecated
   * @default ""
   */
  rolleType: Rolletype;
  /**
   * Rollehistorikk for sak. Returneres kun hvis det er angitt i requestparameter
   * @default ""
   */
  rollehistorikk: RollehistorikkDto[];
}

export interface RollehistorikkDto {
  /**
   * Personens fødselsnummer. Påkrevd for alle
   * @default ""
   */
  fodselsnummer?: string;
  /**
   * Kode for rolletype tilsvarende kodene i T_KODE_ROLLETYPE. Gyldige verdier er f.eks. BM (bidragsmottaker), BP (bidragspliktig) og BA (barn).
   * @default ""
   */
  type: Rolletype;
  reellMottaker?: ReellMottakerDto | null;
  typeEndring?: TypeEndring | null;
  /**
   * Rollen er oppdatert av angitt saksbehandler eller applikasjon
   * @default ""
   */
  opprettetAv?: string | null;
  /**
   * Tidspunkt rollen ble endret
   * @format date-time
   * @default ""
   */
  opprettetTidspunkt: string;
}

/** @default null */
export enum Rolletype {
  BA = "BA",
  BM = "BM",
  BP = "BP",
  FR = "FR",
  RM = "RM",
}

/** @default null */
export enum TypeEndring {
  SattTilBMManuelt = "Satt til BM manuelt",
  SattRMManuelt = "Satt RM manuelt",
  EndretRMManuelt = "Endret RM manuelt",
  RMEndringMaskinelt = "RM-endring maskinelt",
  FNREndringMaskinelt = "FNR-endring maskinelt",
}

export interface OpprettSakResponse {
  saksnummer: string;
}

export interface OpprettMidlertidligTilgangRequest {
  saksnummer: string;
  enhet: string;
  /** @format date */
  tilgangTilOgMedDato?: string | null;
  getårsak:
    | "ADRE"
    | "AUTO"
    | "BRUS"
    | "DISK"
    | "EIER"
    | "EIUT"
    | "ERST"
    | "KLIN"
    | "MAAN"
    | "MAKO"
    | "MAUT"
    | "MOT"
    | "OORG";
}

export interface FjernMidlertidligTilgangRequest {
  saksnummer: string;
  enhet: string;
  getårsak?:
    | "ADRE"
    | "AUTO"
    | "BRUS"
    | "DISK"
    | "EIER"
    | "EIUT"
    | "ERST"
    | "KLIN"
    | "MAAN"
    | "MAKO"
    | "MAUT"
    | "MOT"
    | "OORG";
}

export interface OppdaterSakRequest {
  saksnummer: string;
  status?: "AK" | "IN" | "NY" | "SA" | "SO";
  ansatt?: boolean | null;
  inhabilitet?: boolean | null;
  levdeAdskilt?: boolean | null;
  /** @format date */
  sanertDato?: string | null;
  arbeidsfordeling?: Arbeidsfordeling | null;
  kategorikode?: "U" | "N";
  landkode?: string | null;
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
  konvensjonsdato?: string | null;
  ffuReferansenr?: string | null;
  /** @uniqueItems true */
  roller: RolleDto[];
}

export interface OppdaterSakResponse {
  saksnummer: string;
  eierfogd: string;
  kategorikode: "U" | "N";
  status: "AK" | "IN" | "NY" | "SA" | "SO";
  ansatt: boolean;
  inhabilitet: boolean;
  levdeAdskilt: boolean;
  /** @format date */
  sanertDato?: string | null;
  arbeidsfordeling: Arbeidsfordeling;
  landkode?: string | null;
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
  konvensjonsdato?: string | null;
  ffuReferansenr?: string | null;
  roller: RolleDto[];
}

export interface OppdaterRollerISakRequest {
  /**
   * Saksnummeret til saken som rollene skal oppdateres for.
   * @default ""
   */
  saksnummer: string;
  /**
   * Nye eller oppdaterte roller som skal legges til eller endres i saken.
   * @uniqueItems true
   * @default ""
   */
  roller: RolleDto[];
}

/**
 * Metadata for en bidragssak
 * @default null
 */
export interface BidragssakDto {
  /**
   * Eierfogd for bidragssaken
   * @default ""
   */
  eierfogd: string;
  /**
   * Saksnummeret til bidragssaken
   * @default ""
   */
  saksnummer: string;
  /**
   * Saksstatus til bidragssaken
   * @default ""
   */
  saksstatus: "AK" | "IN" | "NY" | "SA" | "SO";
  /**
   * Kategorikode: 'N' eller 'U'
   * @default ""
   */
  kategori: "U" | "N";
  /**
   * Om saken inneholder personer med diskresjonskode
   * @default false
   */
  begrensetTilgang: boolean;
  /** @format date */
  opprettetDato: string;
  levdeAdskilt: boolean;
  /**
   * Hvor vidt en av partene i saken er ukjent
   * @default false
   */
  ukjentPart: boolean;
  vedtakssperre: boolean;
  avsluttet: boolean;
  arbeidsfordeling: Arbeidsfordeling;
  /**
   * Rollene som saken inneholder
   * @default ""
   */
  roller: RolleDto[];
}

/**
 * Data som trengs for å opprette et saksnummer for en bidragssak
 * @default null
 */
export interface NySakCommandDto {
  /**
   * Sakens eierfogd (enhetsnummeret som får tilgang til saken
   * @default ""
   */
  eierfogd: string;
}

/**
 * Response ved opprettelse av sak
 * @default null
 */
export interface NySakResponseDto {
  /**
   * Saksnummer som ble tildelt
   * @default ""
   */
  saksnummer: string;
}

/**
 * Metadata for pip tjeneste (fnr for involverte roller)
 * @default null
 */
export interface BidragssakPipDto {
  /**
   * Saksnummeret til bidragssaken
   * @default ""
   */
  saksnummer: string;
  /**
   * Om saken er avsluttet
   * @default false
   */
  avsluttet: boolean;
  /**
   * Fødselsnummer til personer innvolvert i bidragssaken
   * @default ""
   */
  roller: string[];
}

/** @default null */
export enum Engangsbeloptype {
  DIREKTE_OPPGJOR = "DIREKTE_OPPGJOR",
  DIREKTEOPPGJOR = "DIREKTE_OPPGJØR",
  ETTERGIVELSE = "ETTERGIVELSE",
  ETTERGIVELSE_TILBAKEKREVING = "ETTERGIVELSE_TILBAKEKREVING",
  GEBYR_MOTTAKER = "GEBYR_MOTTAKER",
  GEBYR_SKYLDNER = "GEBYR_SKYLDNER",
  INNKREVING_GJELD = "INNKREVING_GJELD",
  TILBAKEKREVING = "TILBAKEKREVING",
  TILBAKEKREVING_BIDRAG = "TILBAKEKREVING_BIDRAG",
  SAERTILSKUDD = "SAERTILSKUDD",
  SAeRTILSKUDD = "SÆRTILSKUDD",
  SAeRBIDRAG = "SÆRBIDRAG",
}

/** @default null */
export enum HendelseType {
  AVSLUTTET = "AVSLUTTET",
  AUTOMATISK_AVSLAG = "AUTOMATISK_AVSLAG",
  AVVIST = "AVVIST",
  BRUKERSTOTTE = "BRUKERSTØTTE",
  DOMTAVSLUTTET = "DØMT_AVSLUTTET",
  ENDRINGBARNOVER18 = "ENDRING_BARN_OVER_18",
  ENDRING_KOMMUNE = "ENDRING_KOMMUNE",
  ENDRING_BM = "ENDRING_BM",
  ENDRING_NORSKE_MYNDIGHETER = "ENDRING_NORSKE_MYNDIGHETER",
  ENDRING_BP = "ENDRING_BP",
  ENDRING_UTENLANDSKE_MYNDIGHETER = "ENDRING_UTENLANDSKE_MYNDIGHETER",
  ENDRING_VERGE = "ENDRING_VERGE",
  ERKJENT_AVSLUTTET = "ERKJENT_AVSLUTTET",
  EGET_TILTAK_NAV = "EGET_TILTAK_NAV",
  EGET_TILTAK_NAV_INTERNASJONALT = "EGET_TILTAK_NAV_INTERNASJONALT",
  EGET_TILTAK_BM = "EGET_TILTAK_BM",
  EGET_TILTAK_BP = "EGET_TILTAK_BP",
  SOKNADBARNOVER18 = "SØKNAD_BARN_OVER_18",
  SOKNADNAV = "SØKNAD_NAV",
  SOKNADNAVINTERNASJONALT = "SØKNAD_NAV_INTERNASJONALT",
  SOKNADKOMMUNE = "SØKNAD_KOMMUNE",
  SOKNADBM = "SØKNAD_BM",
  SOKNADNORSKEMYNDIGHETER = "SØKNAD_NORSKE_MYNDIGHETER",
  SOKNADBP = "SØKNAD_BP",
  SOKNADUTENLANDSKEMYNDIGHETER = "SØKNAD_UTENLANDSKE_MYNDIGHETER",
  SOKNADVERGE = "SØKNAD_VERGE",
  FEILREGISTRERT = "FEILREGISTRERT",
  GJELDER_ENDRET = "GJELDER_ENDRET",
  G4 = "G4",
  INNKREVINGSGRUNLAGBARNOVER18 = "INNKREVINGSGRUNLAG_BARN_OVER_18",
  INNKREVINGSGRUNLAG_FYLKESNEMDA = "INNKREVINGSGRUNLAG_FYLKESNEMDA",
  INNKREVINGSGRUNLAG_BM = "INNKREVINGSGRUNLAG_BM",
  INNKREVINGSGRUNLAG_NORSKE_MYNDIGHETER = "INNKREVINGSGRUNLAG_NORSKE_MYNDIGHETER",
  INNKREVINGSGRUNLAG_BP = "INNKREVINGSGRUNLAG_BP",
  INNKREVINGSGRUNLAG_UTENLANDSKE_MYNDIGHETER = "INNKREVINGSGRUNLAG_UTENLANDSKE_MYNDIGHETER",
  INNKREVINGSGRUNLAG_VERGE = "INNKREVINGSGRUNLAG_VERGE",
  INDEKSREGULERT = "INDEKSREGULERT",
  INDEKSREGULERT_KOMMUNE = "INDEKSREGULERT_KOMMUNE",
  INDEKSREGULERT_UTENLANDSKE_MYNDIGHETER = "INDEKSREGULERT_UTENLANDSKE_MYNDIGHETER",
  KLAGE_BEGRENSET_BM_I_ANNEN_SAK = "KLAGE_BEGRENSET_BM_I_ANNEN_SAK",
  KLAGEBEGRENSETBARNOVER18 = "KLAGE_BEGRENSET_BARN_OVER_18",
  KLAGE_BEGRENSET_SATS_BM = "KLAGE_BEGRENSET_SATS_BM",
  KLAGE_BEGRENSET_NORSK_MYNDIGHET = "KLAGE_BEGRENSET_NORSK_MYNDIGHET",
  KLAGE_BEGRENSET_SATS_BP = "KLAGE_BEGRENSET_SATS_BP",
  KLAGE_BEGRENSET_UTENLANDSK_MYNDIGHET = "KLAGE_BEGRENSET_UTENLANDSK_MYNDIGHET",
  KLAGE_BEGRENSET_SATS_VERGE = "KLAGE_BEGRENSET_SATS_VERGE",
  KLAGE_BM_I_ANNEN_SAK = "KLAGE_BM_I_ANNEN_SAK",
  KLAGEBARNOVER18 = "KLAGE_BARN_OVER_18",
  KLAGE_NAV = "KLAGE_NAV",
  KLAGE_FYLKESNEMDA = "KLAGE_FYLKESNEMDA",
  KLAGE_KOMMUNE = "KLAGE_KOMMUNE",
  KLAGE_BM = "KLAGE_BM",
  KLAGE_NORSK_MYNDIGHET = "KLAGE_NORSK_MYNDIGHET",
  KLAGE_BP = "KLAGE_BP",
  KLAGE_UTENLANDSK_MYNDIGHET = "KLAGE_UTENLANDSK_MYNDIGHET",
  KLAGE_VERGE = "KLAGE_VERGE",
  FOLGERKLAGEBMIANNENSAK = "FØLGER_KLAGE_BM_I_ANNEN_SAK",
  FOLGERKLAGEBARNOVER18 = "FØLGER_KLAGE_BARN_OVER_18",
  FOLGERKLAGEBM = "FØLGER_KLAGE_BM",
  FOLGERKLAGENORSKMYNDIGHET = "FØLGER_KLAGE_NORSK_MYNDIGHET",
  FOLGERKLAGEBP = "FØLGER_KLAGE_BP",
  FOLGERKLAGEUTENLANDSKMYNDIGHET = "FØLGER_KLAGE_UTENLANDSK_MYNDIGHET",
  FOLGERKLAGEVERGE = "FØLGER_KLAGE_VERGE",
  KONVENSJONSKOДЕREGISTRERT = "KONVENSJONSKOДЕ_REGISTRERT",
  OMGJORINGBEGRENSETSATS = "OMGJØRING_BEGRENSET_SATS",
  OPPJUSTERING11AR = "OPPJUSTERING_11_ÅR",
  OPPHORBARNOVER18 = "OPPHØR_BARN_OVER_18",
  OPPHORNAV = "OPPHØR_NAV",
  OPPHORFYLKESNEMDA = "OPPHØR_FYLKESNEMDA",
  OPPHORKOMMUNE = "OPPHØR_KOMMUNE",
  OPPHORBM = "OPPHØR_BM",
  OPPHORBP = "OPPHØR_BP",
  OPPHORUTENLANDSKEMYNDIGHETER = "OPPHØR_UTENLANDSKE_MYNDIGHETER",
  OPPHORVERGE = "OPPHØR_VERGE",
  OMGJORINGEGETTILTAK = "OMGJØRING_EGET_TILTAK",
  OMGJORINGEGETTILTAKNAV = "OMGJØRING_EGET_TILTAK_NAV",
  PRIVATAVTALEBARNOVER18 = "PRIVAT_AVTALE_BARN_OVER_18",
  PRIVAT_AVTALE_FYLKESNEMDA = "PRIVAT_AVTALE_FYLKESNEMDA",
  PRIVAT_AVTALE_BM = "PRIVAT_AVTALE_BM",
  PRIVAT_AVTALE_BP = "PRIVAT_AVTALE_BP",
  PRIVAT_AVTALE_UTENLANDSKE_MYNDIGHETER = "PRIVAT_AVTALE_UTENLANDSKE_MYNDIGHETER",
  PRIVAT_AVTALE_VERGE = "PRIVAT_AVTALE_VERGE",
  BEGRENSET_REVURDERING_NAV = "BEGRENSET_REVURDERING_NAV",
  REFERANSENUMMER_REGISTRERT = "REFERANSENUMMER_REGISTRERT",
  ALDERSJUSTERING = "ALDERSJUSTERING",
  SAK_AVSLUTTET = "SAK_AVSLUTTET",
  SAKGJENAPNET = "SAK_GJENÅPNET",
  SAKGJENAPNETMIDLERTIDIG = "SAK_GJENÅPNET_MIDLERTIDIG",
  REVURDERING_NAV = "REVURDERING_NAV",
  REVURDERING_NAV_INTERNASJONALT = "REVURDERING_NAV_INTERNASJONALT",
  REVURDERING_BM = "REVURDERING_BM",
  REVURDERING_BP = "REVURDERING_BP",
  STOPPETBARNFYLLER18 = "STOPPET_BARN_FYLLER_18",
  SENDT_UTLANDET = "SENDT_UTLANDET",
  TRUKKET = "TRUKKET",
  VEDTAKBARNOVER18 = "VEDTAK_BARN_OVER_18",
  VEDTAK_BM = "VEDTAK_BM",
  VEDTAK_BP = "VEDTAK_BP",
  VEDTAK = "VEDTAK",
  VEDTAK_FTK = "VEDTAK_FTK",
  VEDTAK_FYLKESNEMDA = "VEDTAK_FYLKESNEMDA",
  VEDTAK_FRA_BOST = "VEDTAK_FRA_BOST",
  VEDTAK_KOMMUNE = "VEDTAK_KOMMUNE",
  VEDTAK_MIDLERTIDIG = "VEDTAK_MIDLERTIDIG",
  VEDTAK_UTENLANDSKE_MYNDIGHETER = "VEDTAK_UTENLANDSKE_MYNDIGHETER",
  VEDTAK_VERGE = "VEDTAK_VERGE",
  VEDTAKSFORSLAG = "VEDTAKSFORSLAG",
  INNKREVINGSVEDTAK = "INNKREVINGSVEDTAK",
  PARAGRAF35C = "PARAGRAF_35C",
  PARAGRAF35CBEGRENSETSATS = "PARAGRAF_35C_BEGRENSET_SATS",
  KLAGEVEDTAK = "KLAGEVEDTAK",
  OMGJORINGSVEDTAK = "OMGJØRINGSVEDTAK",
  FORHOLDSMESSIG_FORDELING = "FORHOLDSMESSIG_FORDELING",
  REVURDERING_TRUKKET = "REVURDERING_TRUKKET",
  FORHOLDSMESSIG_FORDELING_KLAGE = "FORHOLDSMESSIG_FORDELING_KLAGE",
}

export interface SakshendelseDto {
  hendelseId?: string | null;
  /** @format date-time */
  opprettetTidspunkt: string;
  enhet: string;
  søknadsgruppe?: SoknadGruppeKombinasjon | null;
  type: HendelseType;
  resultat?: string | null;
  link?: string | null;
  søknadsid?: string | null;
  behandlingsid?: string | null;
  vedtaksid?: string | null;
  erLukket: boolean;
  resultatIBisys: boolean;
  erBisysVedtakOgErOverført: boolean;
  erKlageberettigetVedtak: boolean;
  stonadType?: Stonadstype | null;
  engangsbelopType?: Engangsbeloptype | null;
  fraBbm: boolean;
  søktAv?: SoktAvType | null;
  vedtakType?: Vedtakstype | null;
  barnObjektNumre: string[];
  typeBeskrivelse: string;
  søknadsgruppeBeskrivelse?: string | null;
  resultatBeskrivelse?: string | null;
}

/** @default null */
export enum Stonadstype {
  BIDRAG = "BIDRAG",
  FORSKUDD = "FORSKUDD",
  BIDRAG18AAR = "BIDRAG18AAR",
  EKTEFELLEBIDRAG = "EKTEFELLEBIDRAG",
  MOTREGNING = "MOTREGNING",
  OPPFOSTRINGSBIDRAG = "OPPFOSTRINGSBIDRAG",
}

/** @default null */
export enum SoknadGruppeKombinasjon {
  AVSKRIVNING_DIREKTE_BETALT = "AVSKRIVNING_DIREKTE_BETALT",
  BIDRAG = "BIDRAG",
  BIDRAG_TILLEGGSBIDRAG_INNKREVING = "BIDRAG_TILLEGGSBIDRAG_INNKREVING",
  BIDRAG_INNKREVING = "BIDRAG_INNKREVING",
  BIDRAG_TILLEGGSBIDRAG = "BIDRAG_TILLEGGSBIDRAG",
  DIREKTEOPPGJOR = "DIREKTE_OPPGJØR",
  EKTEFELLEBIDRAG_UTEN_INNKREVING = "EKTEFELLEBIDRAG_UTEN_INNKREVING",
  ETTERGIVELSE = "ETTERGIVELSE",
  EKTEFELLEBIDRAG_MED_INNKREVING = "EKTEFELLEBIDRAG_MED_INNKREVING",
  ERSTATNING = "ERSTATNING",
  FARSKAP = "FARSKAP",
  KUNNSKAP_OM_BIOLOGISK_FAR = "KUNNSKAP_OM_BIOLOGISK_FAR",
  FORSKUDD = "FORSKUDD",
  GEBYR = "GEBYR",
  BIDRAG18ARTILLEGGSBIDRAG = "BIDRAG_18_ÅR_TILLEGGSBIDRAG",
  BIDRAG18ARINNKREVING = "BIDRAG_18_ÅR_INNKREVING",
  INNKREVING = "INNKREVING",
  SAeRBIDRAGINNKREVING = "SÆRBIDRAG_INNKREVING",
  BIDRAG18AARTILLEGGSBIDRAGINNKREVING = "BIDRAG_18_AAR_TILLEGGSBIDRAG_INNKREVING",
  MORSKAP = "MORSKAP",
  MOTREGNING = "MOTREGNING",
  OPPFOSTRINGSBIDRAG_INNKREVING = "OPPFOSTRINGSBIDRAG_INNKREVING",
  REFUSJON_BIDRAG = "REFUSJON_BIDRAG",
  SAKSOMKOSTNINGER = "SAKSOMKOSTNINGER",
  SAeRBIDRAG = "SÆRBIDRAG",
  TILLEGGSBIDRAG = "TILLEGGSBIDRAG",
  TILBAKEKREVING_ETTERGIVELSE = "TILBAKEKREVING_ETTERGIVELSE",
  TILLEGGSBIDRAG_INNKREVING = "TILLEGGSBIDRAG_INNKREVING",
  TILBAKEKREVING = "TILBAKEKREVING",
  BIDRAG18AR = "BIDRAG_18_ÅR",
  REISEKOSTNADER = "REISEKOSTNADER",
}

/** @default null */
export enum SoktAvType {
  BIDRAGSMOTTAKER = "BIDRAGSMOTTAKER",
  BIDRAGSPLIKTIG = "BIDRAGSPLIKTIG",
  BARN18AR = "BARN_18_ÅR",
  BM_I_ANNEN_SAK = "BM_I_ANNEN_SAK",
  NAV_BIDRAG = "NAV_BIDRAG",
  FYLKESNEMDA = "FYLKESNEMDA",
  NAV_INTERNASJONALT = "NAV_INTERNASJONALT",
  KOMMUNE = "KOMMUNE",
  NORSKE_MYNDIGHET = "NORSKE_MYNDIGHET",
  UTENLANDSKE_MYNDIGHET = "UTENLANDSKE_MYNDIGHET",
  VERGE = "VERGE",
  TRYGDEETATEN_INNKREVING = "TRYGDEETATEN_INNKREVING",
  KLAGE_ANKE = "KLAGE_ANKE",
  KONVERTERING = "KONVERTERING",
}

/** @default null */
export enum Vedtakstype {
  INDEKSREGULERING = "INDEKSREGULERING",
  ALDERSJUSTERING = "ALDERSJUSTERING",
  OPPHOR = "OPPHØR",
  ALDERSOPPHOR = "ALDERSOPPHØR",
  REVURDERING = "REVURDERING",
  FASTSETTELSE = "FASTSETTELSE",
  INNKREVING = "INNKREVING",
  KLAGE = "KLAGE",
  ENDRING = "ENDRING",
  ENDRING_MOTTAKER = "ENDRING_MOTTAKER",
}

export interface FogdhistorikkDto {
  /** @format int32 */
  tilgangId: number;
  enhetsnummer: string;
  /** @format date */
  tilgangFomDato: string;
  /** @format date */
  tilgangTomDato?: string | null;
  arsak:
    | "ADRE"
    | "AUTO"
    | "BRUS"
    | "DISK"
    | "EIER"
    | "EIUT"
    | "ERST"
    | "KLIN"
    | "MAAN"
    | "MAKO"
    | "MAUT"
    | "MOT"
    | "OORG";
  type: "EIER" | "MIDL";
  opprettetAv?: string | null;
  arsakBeskrivelse: string;
  typeBeskrivelse: string;
}

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "https://bidrag-sak-q2.intern.dev.nav.no",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title bidrag-sak
 * @version v1
 * @baseUrl https://bidrag-sak-q2.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  samhandler = {
    /**
     * @description Finn saksliste hvor en samhandler er i bruk
     *
     * @tags bidrag-sak-controller
     * @name FinnSamhandlerSaker
     * @request POST:/samhandler/sak
     * @secure
     */
    finnSamhandlerSaker: (data: SamhandlerSakerRequestDto, params: RequestParams = {}) =>
      this.request<SamhandlerSakerDto, any>({
        path: `/samhandler/sak`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  sak = {
    /**
     * @description Opprette ny sak
     *
     * @tags bidrag-sak-controller
     * @name OpprettSak
     * @request POST:/sak
     * @secure
     */
    opprettSak: (data: OpprettSakRequest, params: RequestParams = {}) =>
      this.request<OpprettSakResponse, any>({
        path: `/sak`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Opprett midlertidlig tilgang til sak
     *
     * @tags bidrag-sak-controller
     * @name OpprettMidlertidligTilgang
     * @request POST:/sak/tilgang/opprett
     * @secure
     */
    opprettMidlertidligTilgang: (data: OpprettMidlertidligTilgangRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/sak/tilgang/opprett`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Fjern midlertidlig tilgang fra sak
     *
     * @tags bidrag-sak-controller
     * @name FjernMidlertidligTilgang
     * @request POST:/sak/tilgang/fjern
     * @secure
     */
    fjernMidlertidligTilgang: (data: FjernMidlertidligTilgangRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/sak/tilgang/fjern`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Oppdater sak
     *
     * @tags bidrag-sak-controller
     * @name OppdaterSak
     * @request POST:/sak/oppdater
     * @secure
     */
    oppdaterSak: (data: OppdaterSakRequest, params: RequestParams = {}) =>
      this.request<OppdaterSakResponse, any>({
        path: `/sak/oppdater`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Oppdater sak roller
     *
     * @tags bidrag-sak-controller
     * @name OppdaterSakRoller
     * @request POST:/sak/oppdater/roller
     * @secure
     */
    oppdaterSakRoller: (data: OppdaterRollerISakRequest, params: RequestParams = {}) =>
      this.request<OppdaterSakResponse, any>({
        path: `/sak/oppdater/roller`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Sjekk om en enhet har skrivetilgang til en bidragssak
     *
     * @tags bidrag-sak-controller
     * @name HarSkrivetilgang
     * @request GET:/sak/{saksnummer}/kanSkrive
     * @deprecated
     * @secure
     */
    harSkrivetilgang: (
      saksnummer: string,
      query: {
        enhet: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<boolean, void>({
        path: `/sak/${saksnummer}/kanSkrive`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Finn hendelser for en bidragssak
     *
     * @tags bidrag-sak-controller
     * @name FinnHendelserForSak
     * @request GET:/sak/{saksnummer}/hendelser
     * @secure
     */
    finnHendelserForSak: (saksnummer: string, params: RequestParams = {}) =>
      this.request<SakshendelseDto[], void>({
        path: `/sak/${saksnummer}/hendelser`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  person = {
    /**
     * @description Finn metadata for bidragsaker tilknyttet gitt person
     *
     * @tags bidrag-sak-controller
     * @name FinnForFodselsnummer
     * @request POST:/person/sak
     * @secure
     */
    finnForFodselsnummer: (data: string, params: RequestParams = {}) =>
      this.request<BidragssakDto[], any>({
        path: `/person/sak`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  bidragSak = {
    /**
     * @description Opprette ny sak
     *
     * @tags bidrag-sak-controller
     * @name Post
     * @request POST:/bidrag-sak/sak/ny
     * @secure
     */
    post: (data: NySakCommandDto, params: RequestParams = {}) =>
      this.request<NySakResponseDto, NySakResponseDto>({
        path: `/bidrag-sak/sak/ny`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Finn metadata for en bidragssak
     *
     * @tags bidrag-sak-controller
     * @name FindMetadataForSak
     * @request GET:/bidrag-sak/sak/{saksnummer}
     * @secure
     */
    findMetadataForSak: (
      saksnummer: string,
      query?: {
        /** @default false */
        "vis-rollehistorikk"?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<BidragssakDto, void>({
        path: `/bidrag-sak/sak/${saksnummer}`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Finn fogdhistorikk for en bidragssak
     *
     * @tags bidrag-sak-controller
     * @name FinnFogdhistorikk
     * @request GET:/bidrag-sak/sak/{saksnummer}/fogdhistorikk
     * @secure
     */
    finnFogdhistorikk: (saksnummer: string, params: RequestParams = {}) =>
      this.request<FogdhistorikkDto[], any>({
        path: `/bidrag-sak/sak/${saksnummer}/fogdhistorikk`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Finn metadata om for en bidragssak
     *
     * @tags pip-controller
     * @name HentSakPip
     * @request GET:/bidrag-sak/pip/sak/{saksnummer}
     * @secure
     */
    hentSakPip: (saksnummer: string, params: RequestParams = {}) =>
      this.request<BidragssakPipDto, any>({
        path: `/bidrag-sak/pip/sak/${saksnummer}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Finn metadata for bidragsaker tilknyttet gitt person
     *
     * @tags bidrag-sak-controller
     * @name Find
     * @request GET:/bidrag-sak/person/sak/{personident}
     * @deprecated
     * @secure
     */
    find: (personident: string, params: RequestParams = {}) =>
      this.request<BidragssakDto[], void>({
        path: `/bidrag-sak/person/sak/${personident}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  v2 = {
    /**
     * @description Finn metadata om for en bidragssak
     *
     * @tags pip-controller
     * @name HentSakPipMedAzureToken
     * @request GET:/v2/pip/sak/{saksnummer}
     * @secure
     */
    hentSakPipMedAzureToken: (saksnummer: string, params: RequestParams = {}) =>
      this.request<BidragssakPipDto, any>({
        path: `/v2/pip/sak/${saksnummer}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}
