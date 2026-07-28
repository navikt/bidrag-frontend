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

export interface OppdaterEttersendelseDokumentRequest {
  /** @format int64 */
  id?: number | null;
  tittel: string;
  skjemaId?: string | null;
}

export interface OppdaterEttersendingsoppgaveRequest {
  /** @format int64 */
  forsendelseId: number;
  tittel?: string | null;
  ettersendelseForJournalpostId?: string | null;
  skjemaId?: string | null;
  /** @format int32 */
  innsendingsfristDager?: number | null;
  oppdaterDokument?: OppdaterEttersendelseDokumentRequest | null;
}

export interface EttersendingsoppgaveDto {
  tittel?: string | null;
  ettersendelseForJournalpostId?: string | null;
  skjemaId?: string | null;
  /** @format int32 */
  innsendingsfristDager?: number | null;
  vedleggsliste: EttersendingsoppgaveVedleggDto[];
}

export interface EttersendingsoppgaveVedleggDto {
  tittel: string;
  skjemaId?: string | null;
  /** @format int64 */
  id: number;
}

export interface BehandlingInfoDto {
  vedtakId?: string | null;
  behandlingId?: string | null;
  soknadId?: string | null;
  engangsBelopType?: Engangsbeloptype | null;
  stonadType?: Stonadstype | null;
  /** Brukes bare hvis stonadType og engangsbelopType er null */
  behandlingType?: string | null;
  vedtakType?: Vedtakstype | null;
  /** Soknadtype er gamle kodeverdier som er erstattet av vedtaktype. */
  soknadType?: string | null;
  erFattetBeregnet?: boolean | null;
  /** Hvis resultatkoden fra BBM er IT så skal denne være sann */
  erVedtakIkkeTilbakekreving?: boolean | null;
  soknadFra?: SoktAvType | null;
  barnIBehandling: string[];
}

export enum DokumentArkivSystemDto {
  JOARK = "JOARK",
  MIDLERTIDLIG_BREVLAGER = "MIDLERTIDLIG_BREVLAGER",
  UKJENT = "UKJENT",
  BIDRAG = "BIDRAG",
  FORSENDELSE = "FORSENDELSE",
}

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

export enum JournalTema {
  BID = "BID",
  FAR = "FAR",
}

export interface MottakerAdresseTo {
  adresselinje1: string;
  adresselinje2?: string | null;
  adresselinje3?: string | null;
  bruksenhetsnummer?: string | null;
  /** Lankode må være i ISO 3166-1 alpha-2 format */
  landkode?: string | null;
  /** Lankode må være i ISO 3166-1 alpha-3 format */
  landkode3?: string | null;
  postnummer?: string | null;
  poststed?: string | null;
}

export enum MottakerIdentTypeTo {
  FNR = "FNR",
  SAMHANDLER = "SAMHANDLER",
}

export interface MottakerTo {
  ident?: string | null;
  språk?: string | null;
  navn?: string | null;
  identType?: MottakerIdentTypeTo | null;
  adresse?: MottakerAdresseTo | null;
}

/** Metadata for dokument som skal knyttes til forsendelsen. Første dokument i listen blir automatisk satt som hoveddokument i forsendelsen */
export interface OpprettDokumentForesporsel {
  /** Dokumentets tittel */
  tittel: string;
  /** Språket på inneholdet i dokumentet. */
  språk?: string | null;
  arkivsystem?: DokumentArkivSystemDto | null;
  /**
   * Dato dokument ble opprettet
   * @format date-time
   */
  dokumentDato?: string | null;
  /** Referansen til dokumentet hvis det er allerede er lagret i arkivsystem. Hvis dette ikke settes opprettes det en ny dokumentreferanse som kan brukes ved opprettelse av dokument */
  dokumentreferanse?: string | null;
  /** JournalpostId til dokumentet hvis det er allerede er lagret i arkivsystem */
  journalpostId?: string | null;
  /** DokumentmalId sier noe om dokumentets innhold og oppbygning. (Også kjent som brevkode) */
  dokumentmalId?: string | null;
  /** Om dokumentet med dokumentmalId skal bestilles. Hvis dette er satt til false så antas det at kallende system bestiller dokumentet selv. */
  bestillDokument: boolean;
  /** Om dokumentet skal automatisk ferdigstilles etter bestilling */
  ferdigstill: boolean;
}

/** Metadata for opprettelse av forsendelse */
export interface OpprettForsendelseForesporsel {
  /** Ident til brukeren som journalposten gjelder */
  gjelderIdent: string;
  mottaker?: MottakerTo | null;
  /**
   *
   *     Dokumenter som skal knyttes til journalpost.
   *     En journalpost må minst ha et dokument.
   *     Det første dokument i meldingen blir tilknyttet som hoveddokument på journalposten.
   */
  dokumenter: OpprettDokumentForesporsel[];
  /** Bidragsak som forsendelse skal tilknyttes */
  saksnummer: string;
  /** NAV-enheten som oppretter forsendelsen */
  enhet: string;
  behandlingInfo?: BehandlingInfoDto | null;
  /** Identifikator til batch kjøring forsendelsen ble opprettet av */
  batchId?: string | null;
  tema?: JournalTema | null;
  /** Språk forsendelsen skal være på */
  språk?: string | null;
  /** Ident til saksbehandler som oppretter journalpost. Dette vil prioriteres over ident som tilhører tokenet til kallet. */
  saksbehandlerIdent?: string | null;
  /** Opprett tittel på forsendelse automatisk basert på behandling detaljer. Skal bare settes til false hvis gamle brevmeny (Bisys) brukes */
  opprettTittel?: boolean | null;
  unikReferanse?: string | null;
  /** Distribuer forsendelse automatisk etter ferdigstilling. Dette kan brukes hvis det er opprettet av batch eller en vedtaksbrev som skal automatisk distribueres etter fattet vedtak (feks manuell aldersjustering) */
  distribuerAutomatiskEtterFerdigstilling: boolean;
}

export enum Stonadstype {
  BIDRAG = "BIDRAG",
  FORSKUDD = "FORSKUDD",
  BIDRAG18AAR = "BIDRAG18AAR",
  EKTEFELLEBIDRAG = "EKTEFELLEBIDRAG",
  MOTREGNING = "MOTREGNING",
  OPPFOSTRINGSBIDRAG = "OPPFOSTRINGSBIDRAG",
}

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

export interface ConflictException {
  message?: string | null;
  body?: any;
  cause?: {
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    suppressed?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      localizedMessage?: string;
    }[];
    localizedMessage?: string;
  };
  stackTrace?: {
    classLoaderName?: string;
    moduleName?: string;
    moduleVersion?: string;
    methodName?: string;
    fileName?: string;
    /** @format int32 */
    lineNumber?: number;
    className?: string;
    nativeMethod?: boolean;
  }[];
  statusCode?: DefaultHttpStatusCode | HttpStatus;
  statusText?: string;
  responseHeaders?: HttpHeaders;
  responseBodyAsString?: string;
  /** @format byte */
  responseBodyAsByteArray?: string;
  bodyConvertFunction?: any;
  rootCause?: {
    cause?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      suppressed?: {
        stackTrace?: {
          classLoaderName?: string;
          moduleName?: string;
          moduleVersion?: string;
          methodName?: string;
          fileName?: string;
          /** @format int32 */
          lineNumber?: number;
          className?: string;
          nativeMethod?: boolean;
        }[];
        message?: string;
        localizedMessage?: string;
      }[];
      localizedMessage?: string;
    };
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    suppressed?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      localizedMessage?: string;
    }[];
    localizedMessage?: string;
  };
  mostSpecificCause?: {
    cause?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      suppressed?: {
        stackTrace?: {
          classLoaderName?: string;
          moduleName?: string;
          moduleVersion?: string;
          methodName?: string;
          fileName?: string;
          /** @format int32 */
          lineNumber?: number;
          className?: string;
          nativeMethod?: boolean;
        }[];
        message?: string;
        localizedMessage?: string;
      }[];
      localizedMessage?: string;
    };
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    suppressed?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      localizedMessage?: string;
    }[];
    localizedMessage?: string;
  };
  suppressed?: {
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    localizedMessage?: string;
  }[];
  localizedMessage?: string;
}

export interface ContentDisposition {
  type?: string;
  name?: string;
  filename?: string;
  charset?: string;
  attachment?: boolean;
  formData?: boolean;
  inline?: boolean;
}

export type DefaultHttpStatusCode = HttpStatusCode;

export interface HttpHeaders {
  acceptCharset?: string[];
  contentDisposition?: ContentDisposition;
  host?: {
    address?: {
      hostAddress?: string;
      /** @format byte */
      address?: string;
      hostName?: string;
      linkLocalAddress?: boolean;
      multicastAddress?: boolean;
      anyLocalAddress?: boolean;
      loopbackAddress?: boolean;
      siteLocalAddress?: boolean;
      mcglobal?: boolean;
      mcnodeLocal?: boolean;
      mclinkLocal?: boolean;
      mcsiteLocal?: boolean;
      mcorgLocal?: boolean;
      canonicalHostName?: string;
    };
    /** @format int32 */
    port?: number;
    unresolved?: boolean;
    hostName?: string;
    hostString?: string;
  };
  empty?: boolean;
  /** @format uri */
  location?: string;
  all?: Record<string, string>;
  /** @format int64 */
  lastModified?: number;
  /** @format int64 */
  date?: number;
  /** @format int64 */
  contentLength?: number;
  range?: HttpRange[];
  etag?: string;
  connection?: string[];
  origin?: string;
  /** @format int64 */
  expires?: number;
  vary?: string[];
  /** @uniqueItems true */
  allow?: HttpMethod[];
  upgrade?: string;
  accept?: MediaType[];
  ifMatch?: string[];
  accessControlAllowMethods?: HttpMethod[];
  accessControlExposeHeaders?: string[];
  pragma?: string;
  acceptLanguageAsLocales?: string[];
  acceptPatch?: MediaType[];
  accessControlAllowOrigin?: string;
  /** @format int64 */
  accessControlMaxAge?: number;
  contentLanguage?: string;
  ifNoneMatch?: string[];
  /** @format int64 */
  ifUnmodifiedSince?: number;
  acceptLanguage?: {
    range?: string;
    /** @format double */
    weight?: number;
  }[];
  basicAuth?: string;
  bearerAuth?: string;
  cacheControl?: string;
  accessControlRequestMethod?: HttpMethod;
  accessControlRequestHeaders?: string[];
  accessControlAllowHeaders?: string[];
  accessControlAllowCredentials?: boolean;
  contentType?: MediaType;
  /** @format int64 */
  ifModifiedSince?: number;
}

export type HttpMethod = any;

export type HttpRange = any;

export enum HttpStatus {
  Value100CONTINUE = "100 CONTINUE",
  Value101SWITCHINGPROTOCOLS = "101 SWITCHING_PROTOCOLS",
  Value102PROCESSING = "102 PROCESSING",
  Value103EARLYHINTS = "103 EARLY_HINTS",
  Value200OK = "200 OK",
  Value201CREATED = "201 CREATED",
  Value202ACCEPTED = "202 ACCEPTED",
  Value203NONAUTHORITATIVEINFORMATION = "203 NON_AUTHORITATIVE_INFORMATION",
  Value204NOCONTENT = "204 NO_CONTENT",
  Value205RESETCONTENT = "205 RESET_CONTENT",
  Value206PARTIALCONTENT = "206 PARTIAL_CONTENT",
  Value207MULTISTATUS = "207 MULTI_STATUS",
  Value208ALREADYREPORTED = "208 ALREADY_REPORTED",
  Value226IMUSED = "226 IM_USED",
  Value300MULTIPLECHOICES = "300 MULTIPLE_CHOICES",
  Value301MOVEDPERMANENTLY = "301 MOVED_PERMANENTLY",
  Value302FOUND = "302 FOUND",
  Value303SEEOTHER = "303 SEE_OTHER",
  Value304NOTMODIFIED = "304 NOT_MODIFIED",
  Value307TEMPORARYREDIRECT = "307 TEMPORARY_REDIRECT",
  Value308PERMANENTREDIRECT = "308 PERMANENT_REDIRECT",
  Value400BADREQUEST = "400 BAD_REQUEST",
  Value401UNAUTHORIZED = "401 UNAUTHORIZED",
  Value402PAYMENTREQUIRED = "402 PAYMENT_REQUIRED",
  Value403FORBIDDEN = "403 FORBIDDEN",
  Value404NOTFOUND = "404 NOT_FOUND",
  Value405METHODNOTALLOWED = "405 METHOD_NOT_ALLOWED",
  Value406NOTACCEPTABLE = "406 NOT_ACCEPTABLE",
  Value407PROXYAUTHENTICATIONREQUIRED = "407 PROXY_AUTHENTICATION_REQUIRED",
  Value408REQUESTTIMEOUT = "408 REQUEST_TIMEOUT",
  Value409CONFLICT = "409 CONFLICT",
  Value410GONE = "410 GONE",
  Value411LENGTHREQUIRED = "411 LENGTH_REQUIRED",
  Value412PRECONDITIONFAILED = "412 PRECONDITION_FAILED",
  Value413CONTENTTOOLARGE = "413 CONTENT_TOO_LARGE",
  Value413PAYLOADTOOLARGE = "413 PAYLOAD_TOO_LARGE",
  Value414URITOOLONG = "414 URI_TOO_LONG",
  Value415UNSUPPORTEDMEDIATYPE = "415 UNSUPPORTED_MEDIA_TYPE",
  Value416REQUESTEDRANGENOTSATISFIABLE = "416 REQUESTED_RANGE_NOT_SATISFIABLE",
  Value417EXPECTATIONFAILED = "417 EXPECTATION_FAILED",
  Value418IAMATEAPOT = "418 I_AM_A_TEAPOT",
  Value421MISDIRECTEDREQUEST = "421 MISDIRECTED_REQUEST",
  Value422UNPROCESSABLECONTENT = "422 UNPROCESSABLE_CONTENT",
  Value422UNPROCESSABLEENTITY = "422 UNPROCESSABLE_ENTITY",
  Value423LOCKED = "423 LOCKED",
  Value424FAILEDDEPENDENCY = "424 FAILED_DEPENDENCY",
  Value425TOOEARLY = "425 TOO_EARLY",
  Value426UPGRADEREQUIRED = "426 UPGRADE_REQUIRED",
  Value428PRECONDITIONREQUIRED = "428 PRECONDITION_REQUIRED",
  Value429TOOMANYREQUESTS = "429 TOO_MANY_REQUESTS",
  Value431REQUESTHEADERFIELDSTOOLARGE = "431 REQUEST_HEADER_FIELDS_TOO_LARGE",
  Value451UNAVAILABLEFORLEGALREASONS = "451 UNAVAILABLE_FOR_LEGAL_REASONS",
  Value500INTERNALSERVERERROR = "500 INTERNAL_SERVER_ERROR",
  Value501NOTIMPLEMENTED = "501 NOT_IMPLEMENTED",
  Value502BADGATEWAY = "502 BAD_GATEWAY",
  Value503SERVICEUNAVAILABLE = "503 SERVICE_UNAVAILABLE",
  Value504GATEWAYTIMEOUT = "504 GATEWAY_TIMEOUT",
  Value505HTTPVERSIONNOTSUPPORTED = "505 HTTP_VERSION_NOT_SUPPORTED",
  Value506VARIANTALSONEGOTIATES = "506 VARIANT_ALSO_NEGOTIATES",
  Value507INSUFFICIENTSTORAGE = "507 INSUFFICIENT_STORAGE",
  Value508LOOPDETECTED = "508 LOOP_DETECTED",
  Value509BANDWIDTHLIMITEXCEEDED = "509 BANDWIDTH_LIMIT_EXCEEDED",
  Value510NOTEXTENDED = "510 NOT_EXTENDED",
  Value511NETWORKAUTHENTICATIONREQUIRED = "511 NETWORK_AUTHENTICATION_REQUIRED",
}

export interface HttpStatusCode {
  error?: boolean;
  is2xxSuccessful?: boolean;
  is4xxClientError?: boolean;
  is1xxInformational?: boolean;
  is3xxRedirection?: boolean;
  is5xxServerError?: boolean;
}

export interface MediaType {
  type?: string;
  subtype?: string;
  parameters?: Record<string, string>;
  /** @format double */
  qualityValue?: number;
  wildcardType?: boolean;
  wildcardSubtype?: boolean;
  subtypeSuffix?: string;
  charset?: string;
  concrete?: boolean;
}

/** Metadata til en respons etter dokumenter i forsendelse ble opprettet */
export interface DokumentRespons {
  dokumentreferanse: string;
  /** Originale dokumentreferanse hvis er kopi av en ekstern dokument (feks fra JOARK) */
  originalDokumentreferanse?: string | null;
  /** Originale journalpostid hvis er kopi av en ekstern dokument (feks fra JOARK) */
  originalJournalpostId?: string | null;
  forsendelseId?: string | null;
  tittel: string;
  /** @format date-time */
  dokumentDato: string;
  journalpostId?: string | null;
  dokumentmalId?: string | null;
  redigeringMetadata?: string | null;
  erSkjema: boolean;
  status?: DokumentStatusTo | null;
  arkivsystem?: DokumentArkivSystemDto | null;
}

/** Dette skal være UNDER_PRODUKSJON for redigerbare dokumenter som ikke er ferdigprodusert. Ellers settes det til FERDIGSTILT */
export enum DokumentStatusTo {
  IKKE_BESTILT = "IKKE_BESTILT",
  BESTILLING_FEILET = "BESTILLING_FEILET",
  AVBRUTT = "AVBRUTT",
  UNDER_PRODUKSJON = "UNDER_PRODUKSJON",
  UNDER_REDIGERING = "UNDER_REDIGERING",
  FERDIGSTILT = "FERDIGSTILT",
  MAKONTROLLERES = "MÅ_KONTROLLERES",
  KONTROLLERT = "KONTROLLERT",
}

/** Type på forsendelse. Kan være NOTAT eller UTGÅENDE */
export enum ForsendelseTypeTo {
  UTGAENDE = "UTGÅENDE",
  NOTAT = "NOTAT",
}

/** Metadata til en respons etter forsendelse ble opprettet */
export interface OpprettForsendelseRespons {
  /**
   * ForsendelseId på forsendelse som ble opprettet
   * @format int64
   */
  forsendelseId?: number | null;
  forsendelseType?: ForsendelseTypeTo | null;
  /** Liste med dokumenter som er knyttet til journalposten */
  dokumenter: DokumentRespons[];
}

/** En avvikshendelse som kan utføres på en journalpost */
export interface Avvikshendelse {
  /** Type avvik */
  avvikType: string;
  /** Manuell beskrivelse av avvik */
  beskrivelse?: string | null;
  /** Eventuelle detaljer som skal følge avviket */
  detaljer: Record<string, string>;
  /** Saksnummer til sak når journalpost er journalført */
  saksnummer?: string | null;
  adresse?: DistribuerTilAdresse | null;
  /** Dokumenter som brukes ved kopiering ny journalpost. Benyttes ved avvik KOPIER_FRA_ANNEN_FAGOMRADE */
  dokumenter?: any[] | null;
}

/** Adresse for hvor brev sendes ved sentral print */
export interface DistribuerTilAdresse {
  adresselinje1?: string | null;
  adresselinje2?: string | null;
  adresselinje3?: string | null;
  /** ISO 3166-1 alpha-2 to-bokstavers landkode */
  land?: string | null;
  postnummer?: string | null;
  poststed?: string | null;
}

/** Metadata for et dokument */
export interface DokumentDto {
  /** Referansen til dokumentet i arkivsystemet */
  dokumentreferanse?: string | null;
  /** Journalpost hvor dokumentet er arkivert. Dette brukes hvis dokumentet er arkivert i annen arkivsystem enn det som er sendt med i forespørsel. */
  journalpostId?: string | null;
  /**
   * Inngående (I), utgående (U) dokument, (X) internt notat
   * @deprecated
   */
  dokumentType?: string | null;
  /** Kort oppsummering av dokumentets innhold */
  tittel?: string | null;
  /** Selve PDF dokumentet formatert som Base64 */
  dokument?: string | null;
  /**
   * Typen dokument. Brevkoden sier noe om dokumentets innhold og oppbygning. Erstattes av dokumentmalId
   * @deprecated
   */
  brevkode?: string | null;
  /** Typen dokument. Dokumentmal sier noe om dokumentets innhold og oppbygning. */
  dokumentmalId?: string | null;
  status?: DokumentStatusDto | null;
  arkivSystem?: DokumentArkivSystemDto | null;
  /** Metadata om dokumentet */
  metadata: Record<string, string>;
}

export enum DokumentStatusDto {
  IKKE_BESTILT = "IKKE_BESTILT",
  BESTILLING_FEILET = "BESTILLING_FEILET",
  UNDER_PRODUKSJON = "UNDER_PRODUKSJON",
  UNDER_REDIGERING = "UNDER_REDIGERING",
  FERDIGSTILT = "FERDIGSTILT",
  AVBRUTT = "AVBRUTT",
}

/** Bestill distribusjon av journalpost */
export interface DistribuerJournalpostRequest {
  /** Identifiserer batch som forsendelsen inngår i. Brukes for sporing */
  batchId?: string | null;
  /** Forsendelsen er skrevet ut og distribuert lokalt. Distribusjon registreres men ingen distribusjon bestilles. */
  lokalUtskrift: boolean;
  adresse?: DistribuerTilAdresse | null;
  ettersendingsoppgave?: OpprettEttersendingsppgaveDto | null;
}

export interface OpprettEttersendingsoppgaveVedleggDto {
  tittel?: string | null;
  url?: string | null;
  vedleggsnr: string;
}

export interface OpprettEttersendingsppgaveDto {
  tittel: string;
  skjemaId: string;
  språk: Sprak;
  /** @format int32 */
  innsendingsFristDager: number;
  vedleggsliste: OpprettEttersendingsoppgaveVedleggDto[];
}

export enum Sprak {
  NB = "NB",
  NN = "NN",
  AR = "AR",
  DA = "DA",
  DE = "DE",
  EN = "EN",
  EL = "EL",
  ET = "ET",
  ES = "ES",
  FI = "FI",
  FR = "FR",
  IS = "IS",
  IT = "IT",
  JA = "JA",
  HR = "HR",
  LV = "LV",
  LT = "LT",
  NL = "NL",
  PL = "PL",
  PT = "PT",
  RO = "RO",
  RU = "RU",
  SR = "SR",
  SL = "SL",
  SK = "SK",
  SV = "SV",
  TH = "TH",
  TR = "TR",
  UK = "UK",
  HU = "HU",
  VI = "VI",
}

/** Respons etter bestilt distribusjon */
export interface DistribuerJournalpostResponse {
  /** Journalpostid for dokument som det ble bestilt distribusjon for */
  journalpostId: string;
  /** Bestillingid som unikt identifiserer distribusjonsbestillingen. Vil være null hvis ingen distribusjon er bestilt. */
  bestillingsId?: string | null;
  ettersendingsoppgave?: OpprettEttersendingsoppgaveResponseDto | null;
}

export interface OpprettEttersendingsoppgaveResponseDto {
  innsendingsId: string;
}

export interface OpprettEttersendingsoppgaveRequest {
  /** @format int64 */
  forsendelseId: number;
  tittel?: string | null;
  ettersendelseForJournalpostId: string;
  skjemaId: string;
}

export interface HentDokumentValgRequest {
  soknadType?: string | null;
  vedtakType?: Vedtakstype | null;
  behandlingType?: string | null;
  soknadFra?: SoktAvType | null;
  erFattetBeregnet?: boolean | null;
  erVedtakIkkeTilbakekreving?: boolean | null;
  vedtakId?: string | null;
  behandlingId?: string | null;
  soknadId?: string | null;
  enhet?: string | null;
  inneholderAldersjustering?: boolean | null;
  erOrkestrertVedtak?: boolean | null;
  stonadType?: Stonadstype | null;
  engangsBelopType?: Engangsbeloptype | null;
  /** @format int64 */
  forsendelseId?: number | null;
  behandlingtypeKonvertert?: string | null;
}

export interface DokumentMalDetaljer {
  malId: string;
  tittel: string;
  type: "UTGÅENDE" | "NOTAT";
  kanBestilles: boolean;
  redigerbar: boolean;
  beskrivelse: string;
  nyDokumentProduksjon: boolean;
  statiskInnhold: boolean;
  kreverVedtak: boolean;
  kreverBehandling: boolean;
  innholdType?:
    | "NOTAT"
    | "VARSEL_STANDARD"
    | "VARSEL"
    | "VEDTAK"
    | "VEDLEGG_VEDTAK"
    | "VEDLEGG_VARSEL"
    | "VEDLEGG"
    | "SKJEMA";
  gruppeVisningsnavn?: string | null;
  språk: string[];
  tilhorerEnheter: string[];
  alternativeTitler: string[];
}

export interface ForsendelseBarnIBehandlingDto {
  ident: string;
  erRevurderingsbarn: boolean;
  erBidrag18År: boolean;
}

export interface HentDokumentValgResponse {
  dokumentMalDetaljer: Record<string, DokumentMalDetaljer>;
  automatiskOpprettDokumenter: DokumentMalDetaljer[];
  barnIBehandlingDetaljer: ForsendelseBarnIBehandlingDto[];
}

/** Metadata for dokument som skal knyttes til forsendelsen. Første dokument i listen blir automatisk satt som hoveddokument i forsendelsen */
export interface OppdaterDokumentForesporsel {
  /** JournalpostId til dokumentet hvis det er allerede er lagret i arkivsystem */
  journalpostId?: string | null;
  dokumentmalId?: string | null;
  dokumentreferanse?: string | null;
  /** Språket på innholdet i dokumentet */
  språk?: string | null;
  tittel?: string | null;
  fjernTilknytning?: boolean | null;
  /** @format date-time */
  dokumentDato?: string | null;
  arkivsystem?: DokumentArkivSystemDto | null;
}

/** Metadata for oppdatering av forsendelse */
export interface OppdaterForsendelseForesporsel {
  /** Liste over dokumentene på journalposten der metadata skal oppdateres */
  dokumenter: OppdaterDokumentForesporsel[];
  /**
   * Dato hoveddokument i forsendelsen ble opprettet
   * @format date-time
   */
  dokumentDato?: string | null;
  /** Ident til brukeren som journalposten gjelder. Kan bare oppdateres hvis status = UNDER_OPPRETTELSE */
  gjelderIdent?: string | null;
  mottaker?: MottakerTo | null;
  /** NAV-enheten som oppretter forsendelsen. Kan bare oppdateres hvis status = UNDER_OPPRETTELSE */
  enhet?: string | null;
  tema?: JournalTema | null;
  /** Språk forsendelsen skal være på */
  språk?: string | null;
}

/** Metadata til en respons etter journalpost ble oppdatert */
export interface OppdaterForsendelseResponse {
  /** ForsendelseId på forsendelse som ble opprettet */
  forsendelseId?: string | null;
  /** Tittel på forsendelsen */
  tittel?: string | null;
  /** Liste med dokumenter som er knyttet til journalposten */
  dokumenter: DokumentRespons[];
}

export interface FerdigstillDokumentRequest {
  /**
   * @format binary
   * @minLength 1
   */
  fysiskDokument: File;
  redigeringMetadata?: string | null;
}

/** Metadata for endring av et dokument */
export interface EndreDokument {
  /** Brevkoden til dokumentet */
  brevkode?: string | null;
  /**
   * Identifikator av dokument informasjon
   * @deprecated
   */
  dokId?: string | null;
  /** Identifikator til dokumentet */
  dokumentreferanse?: string | null;
  /** Tittel på dokumentet */
  tittel?: string | null;
}

/** Metadata for endring av en journalpost */
export interface EndreJournalpostCommand {
  /** Identifikator av journalpost */
  journalpostId?: string | null;
  /**
   * Avsenders navn (med eventuelt fornavn bak komma)
   * @deprecated
   */
  avsenderNavn?: string | null;
  /** Avsender/Mottakers navn (med eventuelt fornavn bak komma) */
  avsenderMottakerNavn?: string | null;
  /** Avsender/Mottakers id */
  avsenderMottakerId?: string | null;
  /** Kort oppsummert av journalført innhold */
  beskrivelse?: string | null;
  /**
   * Dato for dokument i journalpost
   * @format date
   */
  dokumentDato?: string | null;
  /** Fnr/dnr/bostnr eller orgnr for hvem/hva dokumentet gjelder */
  gjelder?: string | null;
  /**
   * Dato dokument ble journalført
   * @format date
   */
  journaldato?: string | null;
  /** Saksnummer til bidragsaker som journalpost skal tilknyttes */
  tilknyttSaker: string[];
  /** En liste over endringer i dokumenter */
  endreDokumenter: EndreDokument[];
  /** Behandlingstema */
  behandlingstema?: string | null;
  /** Endre fagområde */
  fagomrade?: string | null;
  gjelderType?: IdentType | null;
  /** Tittel på journalposten */
  tittel?: string | null;
  /** Skal journalposten journalføres aka. registreres */
  skalJournalfores: boolean;
  /** Liste med retur detaljer som skal endres */
  endreReturDetaljer: EndreReturDetaljer[];
}

/** Metadata for endring av et retur detalj */
export interface EndreReturDetaljer {
  /**
   * Dato på retur detaljer som skal endres
   * @format date
   */
  originalDato?: string | null;
  /**
   * Ny dato på retur detaljer
   * @format date
   */
  nyDato?: string | null;
  /** Beskrivelse av retur (eks. addresse forsøkt sendt) */
  beskrivelse: string;
}

/** Identtypene til en aktør */
export enum IdentType {
  AKTOERID = "AKTOERID",
  FNR = "FNR",
  ORGNR = "ORGNR",
}

export enum DokumentFormatDto {
  PDF = "PDF",
  MBDOK = "MBDOK",
  HTML = "HTML",
}

export interface DokumentMetadata {
  /** Journalpostid med arkiv prefiks som skal benyttes når dokumentet hentes */
  journalpostId?: string | null;
  dokumentreferanse?: string | null;
  tittel?: string | null;
  /** Hvilken format dokument er på. Dette forteller hvordan dokumentet må åpnes. */
  format: DokumentFormatDto;
  /** Status på dokumentet */
  status: DokumentStatusDto;
  /** Hvilken arkivsystem dokumentet er lagret på */
  arkivsystem: DokumentArkivSystemDto;
}

/** Metadata om behandling */
export interface BehandlingInfoResponseDto {
  vedtakId?: string | null;
  behandlingId?: string | null;
  soknadId?: string | null;
  behandlingType?: string | null;
  erFattet?: boolean | null;
  barnIBehandling?: any[] | null;
  barnIBehandlingDetaljer: ForsendelseBarnIBehandlingDto[];
}

/** Metadata om forsendelse */
export interface ForsendelseResponsTo {
  /** @format int64 */
  forsendelseId: number;
  /** Ident til brukeren som journalposten gjelder */
  gjelderIdent?: string | null;
  mottaker?: MottakerTo | null;
  /** Liste over dokumentene på journalposten der metadata skal oppdateres */
  dokumenter: DokumentRespons[];
  /** Bidragsak som forsendelsen er knyttet til */
  saksnummer?: string | null;
  /** NAV-enheten som oppretter forsendelsen */
  enhet?: string | null;
  /** Tema på forsendelsen */
  tema?: string | null;
  behandlingInfo?: BehandlingInfoResponseDto | null;
  ettersendingsoppgave?: EttersendingsoppgaveDto | null;
  /** Ident på saksbehandler eller applikasjon som opprettet forsendelsen */
  opprettetAvIdent?: string | null;
  /** Navn på saksbehandler eller applikasjon som opprettet forsendelsen */
  opprettetAvNavn?: string | null;
  /** Tittel på hoveddokumentet i forsendelsen */
  tittel?: string | null;
  /** Journalpostid som forsendelsen ble arkivert på. Dette vil bli satt hvis status er FERDIGSTILT */
  arkivJournalpostId?: string | null;
  forsendelseType?: ForsendelseTypeTo | null;
  status?: ForsendelseStatusTo | null;
  /**
   * Dato forsendelsen ble opprettet
   * @format date
   */
  opprettetDato?: string | null;
  /**
   * Dato på hoveddokumentet i forsendelsen
   * @format date
   */
  dokumentDato?: string | null;
  /**
   * Dato forsendelsen ble distribuert
   * @format date
   */
  distribuertDato?: string | null;
  unikReferanse?: string | null;
}

/** Status på forsendelsen */
export enum ForsendelseStatusTo {
  UNDER_OPPRETTELSE = "UNDER_OPPRETTELSE",
  UNDER_PRODUKSJON = "UNDER_PRODUKSJON",
  FERDIGSTILT = "FERDIGSTILT",
  SLETTET = "SLETTET",
  DISTRIBUERT = "DISTRIBUERT",
  DISTRIBUERT_LOKALT = "DISTRIBUERT_LOKALT",
}

/** Metadata om en aktør */
export interface AktorDto {
  /** Identifaktor til aktøren */
  ident: string;
  type?: IdentType | null;
}

/**
 *
 * Avsender journalposten ble sendt fra hvis utgående.
 * Mottaker journalposten skal sendes til hvis inngående.
 */
export interface AvsenderMottakerDto {
  /** Avsenders/Mottakers navn (med eventuelt fornavn bak komma). Skal ikke oppgis hvis ident er en FNR */
  navn?: string | null;
  /** Person ident eller organisasjonsnummer */
  ident?: string | null;
  /** Identtype */
  type: AvsenderMottakerDtoIdType;
  adresse?: MottakerAdresseTo | null;
}

export enum AvsenderMottakerDtoIdType {
  FNR = "FNR",
  SAMHANDLER = "SAMHANDLER",
  ORGNR = "ORGNR",
  UTENLANDSK_ORGNR = "UTENLANDSK_ORGNR",
  UKJENT = "UKJENT",
}

export interface EttersendingsppgaveDto {
  tittel: string;
  skjemaId: string;
  innsendingsId?: string | null;
  språk: string;
  status:
    | "OPPRETTET"
    | "UTFYLT"
    | "INNSENDT"
    | "SLETTET_AV_BRUKER"
    | "AUTOMATISK_SLETTET"
    | "UKJENT"
    | "IKKE_OPPRETTET";
  /** @format date */
  opprettetDato?: string | null;
  /** @format date */
  fristDato?: string | null;
  /** @format date */
  slettesDato?: string | null;
  vedleggsliste: EttersendingsoppgaveVedleggDto[];
}

/** Metadata til en journalpost */
export interface JournalpostDto {
  /**
   * Avsenders navn (med eventuelt fornavn bak komma)
   * @deprecated
   */
  avsenderNavn?: string | null;
  avsenderMottaker?: AvsenderMottakerDto | null;
  /** Dokumentene som følger journalposten */
  dokumenter: DokumentDto[];
  /**
   * Dato for dokument i journalpost
   * @format date
   */
  dokumentDato?: string | null;
  /**
   * Tidspunkt for dokument i journalpost
   * @format date-time
   */
  dokumentTidspunkt?: string | null;
  /**
   * Dato dokumentene på journalposten ble sendt til bruker.
   * @format date
   */
  ekspedertDato?: string | null;
  /** Fagområdet for journalposten. BID for bidrag og FAR for farskap */
  fagomrade?: string | null;
  /** Ident for hvem/hva dokumente(t/ne) gjelder */
  gjelderIdent?: string | null;
  gjelderAktor?: AktorDto | null;
  /** Kort oppsummert av journalført innhold */
  innhold?: string | null;
  /** Enhetsnummer hvor journalføring ble gjort */
  journalforendeEnhet?: string | null;
  /** Saksbehandler som var journalfører */
  journalfortAv?: string | null;
  /**
   * Dato dokument ble journalført
   * @format date
   */
  journalfortDato?: string | null;
  /** Identifikator av journalpost i midlertidig brevlager eller fra joark på formatet [BID|JOARK]-<journalpostId> */
  journalpostId?: string | null;
  kilde?: Kanal | null;
  kanal?: Kanal | null;
  /**
   * Dato for når dokument er mottat, dvs. dato for journalføring eller skanning
   * @format date
   */
  mottattDato?: string | null;
  /** Inngående (I), utgående (U) journalpost; (X) internt notat */
  dokumentType?: string | null;
  /**
   * Journalpostens status, (A, D, J, M, O, R, S, T, U, KP, EJ, E)
   * @deprecated
   */
  journalstatus?: string | null;
  status?: JournalpostStatus | null;
  /** Om journalposten er feilført på bidragssak */
  feilfort?: boolean | null;
  brevkode?: KodeDto | null;
  returDetaljer?: ReturDetaljer | null;
  /** Joark journalpostid for bidrag journalpost som er arkivert i Joark */
  joarkJournalpostId?: string | null;
  distribuertTilAdresse?: DistribuerTilAdresse | null;
  /** Informasjon om returdetaljer til journalpost */
  sakstilknytninger: string[];
  /** Språket til dokumentet i Journalposten */
  språk?: string | null;
  /** Saksbehandler som opprettet journalposten */
  opprettetAvIdent?: string | null;
  /** Referanse til originale kilden til journalposten. Kan være referanse til forsendelse eller bidrag journalpost med prefiks. Feks BID_12323 eller BIF_123213 */
  eksternReferanseId?: string | null;
  ettersendingsppgave?: EttersendingsppgaveDto | null;
}

export enum JournalpostStatus {
  AVVIK_ENDRE_FAGOMRADE = "AVVIK_ENDRE_FAGOMRADE",
  AVVIK_BESTILL_RESKANNING = "AVVIK_BESTILL_RESKANNING",
  AVVIK_BESTILL_SPLITTING = "AVVIK_BESTILL_SPLITTING",
  MOTTATT = "MOTTATT",
  JOURNALFORT = "JOURNALFØRT",
  EKSPEDERT = "EKSPEDERT",
  EKSPEDERT_JOARK = "EKSPEDERT_JOARK",
  MOTTAKSREGISTRERT = "MOTTAKSREGISTRERT",
  UKJENT = "UKJENT",
  DISTRIBUERT = "DISTRIBUERT",
  AVBRUTT = "AVBRUTT",
  KLAR_FOR_DISTRIBUSJON = "KLAR_FOR_DISTRIBUSJON",
  DOKUMENT_SLETTET = "DOKUMENT_SLETTET",
  RETUR = "RETUR",
  FERDIGSTILT = "FERDIGSTILT",
  FEILREGISTRERT = "FEILREGISTRERT",
  RESERVERT = "RESERVERT",
  UTGAR = "UTGÅR",
  SLETTET = "SLETTET",
  UNDER_OPPRETTELSE = "UNDER_OPPRETTELSE",
  TIL_LAGRING = "TIL_LAGRING",
  OPPRETTET = "OPPRETTET",
  UNDER_PRODUKSJON = "UNDER_PRODUKSJON",
}

/** Journalposten ble mottatt/sendt ut i kanal */
export enum Kanal {
  NAV_NO = "NAV_NO",
  NAV_NO_BID = "NAV_NO_BID",
  SKAN_BID = "SKAN_BID",
  SKAN_NETS = "SKAN_NETS",
  SKAN_IM = "SKAN_IM",
  LOKAL_UTSKRIFT = "LOKAL_UTSKRIFT",
  SENTRAL_UTSKRIFT = "SENTRAL_UTSKRIFT",
  SDP = "SDP",
  INGEN_DISTRIBUSJON = "INGEN_DISTRIBUSJON",
  INNSENDT_NAV_ANSATT = "INNSENDT_NAV_ANSATT",
  NAV_NO_UINNLOGGET = "NAV_NO_UINNLOGGET",
  NAV_NO_CHAT = "NAV_NO_CHAT",
}

/** Metadata for kode vs dekode i et kodeobjekt */
export interface KodeDto {
  /** Koden */
  kode?: string | null;
  /** Dekode (kodebeskrivelse) */
  dekode?: string | null;
  /** Om kodeobjektet inneholder en gyldig verdi */
  erGyldig: boolean;
}

/** Metadata for retur detaljer */
export interface ReturDetaljer {
  /**
   * Dato for siste retur
   * @format date
   */
  dato?: string | null;
  /**
   * Totalt antall returer
   * @format int32
   */
  antall?: number | null;
  /** Liste med logg av alle registrerte returer */
  logg: ReturDetaljerLog[];
}

/** Metadata for retur detaljer log */
export interface ReturDetaljerLog {
  /**
   * Dato for retur
   * @format date
   */
  dato?: string | null;
  /** Beskrivelse av retur (eks. addresse forsøkt sendt) */
  beskrivelse?: string | null;
  /** Returdetalje er låst for endring. Dette blir satt etter en ny distribusjon er bestilt */
  locked?: boolean | null;
}

export interface DokumentDetaljer {
  tittel: string;
  dokumentreferanse?: string | null;
  /** @format int32 */
  antallSider: number;
}

export interface DokumentRedigeringMetadataResponsDto {
  tittel: string;
  /** Dette skal være UNDER_PRODUKSJON for redigerbare dokumenter som ikke er ferdigprodusert. Ellers settes det til FERDIGSTILT */
  status: DokumentStatusTo;
  /** Status på forsendelsen */
  forsendelseStatus: ForsendelseStatusTo;
  redigeringMetadata?: string | null;
  dokumenter: DokumentDetaljer[];
}

/** Metadata til en respons etter journalpost med tilhørende data */
export interface JournalpostResponse {
  journalpost?: JournalpostDto | null;
  /** alle saker som journalposten er tilknyttet */
  sakstilknytninger: string[];
}

/** Metadata om forsendelse */
export interface ForsendelseIkkeDistribuertResponsTo {
  /** Forsendelseid med BIF- prefiks */
  forsendelseId?: string | null;
  /** Bidragsak som forsendelsen er knyttet til */
  saksnummer?: string | null;
  /** NAV-enheten som oppretter forsendelsen */
  enhet?: string | null;
  /** Tittel på hoveddokumentet i forsendelsen */
  tittel?: string | null;
  /**
   * Dato forsendelsen ble opprettet
   * @format date-time
   */
  opprettetDato?: string | null;
}

export interface DokumentSoknadDto {
  brukerId: string;
  skjemanr: string;
  tittel: string;
  tema: string;
  status: "Opprettet" | "Utfylt" | "Innsendt" | "SlettetAvBruker" | "AutomatiskSlettet";
  /** @format date-time */
  opprettetDato: string;
  vedleggsListe: VedleggDto[];
  /** @format int64 */
  id?: number | null;
  innsendingsId?: string | null;
  ettersendingsId?: string | null;
  spraak?: string | null;
  /** @format date-time */
  endretDato?: string | null;
  /** @format date-time */
  innsendtDato?: string | null;
  /** @format int64 */
  visningsSteg?: number | null;
  visningsType?: "fyllUt" | "dokumentinnsending" | "ettersending" | "lospost";
  kanLasteOppAnnet?: boolean | null;
  /** @format date-time */
  innsendingsFristDato?: string | null;
  /** @format date-time */
  forsteInnsendingsDato?: string | null;
  /** @format int64 */
  fristForEttersendelse?: number | null;
  arkiveringsStatus?: "IkkeSatt" | "Arkivert" | "ArkiveringFeilet";
  erSystemGenerert?: boolean | null;
  soknadstype?: "soknad" | "ettersendelse";
  skjemaPath?: string | null;
  applikasjon?: string | null;
  /** @format date-time */
  skalSlettesDato?: string | null;
  /** @format int32 */
  mellomlagringDager?: number | null;
}

export interface VedleggDto {
  tittel: string;
  label: string;
  erHoveddokument: boolean;
  erVariant: boolean;
  erPdfa: boolean;
  erPakrevd: boolean;
  opplastingsStatus:
    | "IkkeValgt"
    | "LastetOpp"
    | "Innsendt"
    | "SendSenere"
    | "SendesAvAndre"
    | "SendesIkke"
    | "LastetOppIkkeRelevantLenger"
    | "LevertDokumentasjonTidligere"
    | "HarIkkeDokumentasjonen"
    | "NavKanHenteDokumentasjon";
  /** @format date-time */
  opprettetdato: string;
  /** @format int64 */
  id?: number | null;
  vedleggsnr?: string | null;
  beskrivelse?: string | null;
  uuid?: string | null;
  mimetype?: "application/pdf" | "application/json" | "image/png" | "image/jpeg" | "application/xml";
  /** @format byte */
  document?: string | null;
  skjemaurl?: string | null;
  /** @format date-time */
  innsendtdato?: string | null;
  formioId?: string | null;
  opplastingsValgKommentarLedetekst?: string | null;
  opplastingsValgKommentar?: string | null;
}

export interface SlettEttersendingsoppgave {
  /** @format int64 */
  forsendelseId: number;
}

export interface SlettEttersendingsoppgaveVedleggRequest {
  /** @format int64 */
  forsendelseId: number;
  /** @format int64 */
  id: number;
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
      baseURL: axiosConfig.baseURL || "https://bidrag-dokument-forsendelse.intern.dev.nav.no",
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
 * @title bidrag-dokument-forsendelse
 * @version v1
 * @baseUrl https://bidrag-dokument-forsendelse.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags ettersendingsoppgave-controller
     * @name OppdaterEttesendingsoppgave
     * @summary Oppretter ny varsel ettersendelse
     * @request PUT:/api/forsendelse/ettersendingsoppgave
     * @secure
     */
    oppdaterEttesendingsoppgave: (data: OppdaterEttersendingsoppgaveRequest, params: RequestParams = {}) =>
      this.request<EttersendingsoppgaveDto, any>({
        path: `/api/forsendelse/ettersendingsoppgave`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ettersendingsoppgave-controller
     * @name OpprettEttersendingsoppgave
     * @summary Oppretter ny ettersendingsoppgave
     * @request POST:/api/forsendelse/ettersendingsoppgave
     * @secure
     */
    opprettEttersendingsoppgave: (data: OpprettEttersendingsoppgaveRequest, params: RequestParams = {}) =>
      this.request<EttersendingsoppgaveDto, any>({
        path: `/api/forsendelse/ettersendingsoppgave`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ettersendingsoppgave-controller
     * @name SlettEttersendingsoppgave
     * @summary Oppretter ny ettersendingsoppave
     * @request DELETE:/api/forsendelse/ettersendingsoppgave
     * @secure
     */
    slettEttersendingsoppgave: (data: SlettEttersendingsoppgave, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/forsendelse/ettersendingsoppgave`,
        method: "DELETE",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags opprett-forsendelse-kontroller
     * @name OpprettForsendelse
     * @summary Oppretter ny forsendelse
     * @request POST:/api/forsendelse
     * @secure
     */
    opprettForsendelse: (data: OpprettForsendelseForesporsel, params: RequestParams = {}) =>
      this.request<OpprettForsendelseRespons, OpprettForsendelseRespons | ConflictException>({
        path: `/api/forsendelse`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags endre-forsendelse-kontroller
     * @name KnyttTilDokument
     * @summary Knytt eller opprett ny dokument til forsendelse
     * @request POST:/api/forsendelse/{forsendelseIdMedPrefix}/dokument
     * @secure
     */
    knyttTilDokument: (forsendelseIdMedPrefix: string, data: OpprettDokumentForesporsel, params: RequestParams = {}) =>
      this.request<DokumentRespons, any>({
        path: `/api/forsendelse/${forsendelseIdMedPrefix}/dokument`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name ValiderPdf
     * @summary Valider om PDF er gyldig PDF/A dokument. Respons vil gi hva som ikke er gyldig hvis ikke gyldig PDF/A.
     * @request POST:/api/forsendelse/redigering/validerPDF
     * @secure
     */
    validerPdf: (data: File, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/forsendelse/redigering/validerPDF`,
        method: "POST",
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name ReparerPdf
     * @summary Reparer PDF hvis den er korrupt
     * @request POST:/api/forsendelse/redigering/reparerPDF
     * @secure
     */
    reparerPdf: (data: File, params: RequestParams = {}) =>
      this.request<any, File>({
        path: `/api/forsendelse/redigering/reparerPDF`,
        method: "POST",
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name ReparerPdfBase64
     * @summary Reparer PDF hvis den er korrupt
     * @request POST:/api/forsendelse/redigering/reparerPDFBase64
     * @secure
     */
    reparerPdfBase64: (data: string, params: RequestParams = {}) =>
      this.request<any, File>({
        path: `/api/forsendelse/redigering/reparerPDFBase64`,
        method: "POST",
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name ConvertToPdfa2
     * @summary Valider om PDF er gyldig PDF/A dokument. Respons vil gi hva som ikke er gyldig hvis ikke gyldig PDF/A.
     * @request POST:/api/forsendelse/redigering/convertToPDFA
     * @secure
     */
    convertToPdfa2: (data: File, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/forsendelse/redigering/convertToPDFA`,
        method: "POST",
        body: data,
        secure: true,
        ...params,
      }),

    /**
     * @description Hent gyldige avvikstyper for forsendelse
     *
     * @tags avvik-kontroller
     * @name HentAvvik
     * @request GET:/api/forsendelse/journal/{forsendelseIdMedPrefix}/avvik
     * @secure
     */
    hentAvvik: (forsendelseIdMedPrefix: string, params: RequestParams = {}) =>
      this.request<
        (
          | "ARKIVERE_JOURNALPOST"
          | "BESTILL_ORIGINAL"
          | "BESTILL_RESKANNING"
          | "BESTILL_SPLITTING"
          | "ENDRE_FAGOMRADE"
          | "SEND_TIL_FAGOMRADE"
          | "KOPIER_FRA_ANNEN_FAGOMRADE"
          | "SEND_KOPI_TIL_FAGOMRADE"
          | "FEILFORE_SAK"
          | "INNG_TIL_UTG_DOKUMENT"
          | "OVERFOR_TIL_ANNEN_ENHET"
          | "SLETT_JOURNALPOST"
          | "TREKK_JOURNALPOST"
          | "REGISTRER_RETUR"
          | "MANGLER_ADRESSE"
          | "BESTILL_NY_DISTRIBUSJON"
          | "FARSKAP_UTELUKKET"
        )[],
        (
          | "ARKIVERE_JOURNALPOST"
          | "BESTILL_ORIGINAL"
          | "BESTILL_RESKANNING"
          | "BESTILL_SPLITTING"
          | "ENDRE_FAGOMRADE"
          | "SEND_TIL_FAGOMRADE"
          | "KOPIER_FRA_ANNEN_FAGOMRADE"
          | "SEND_KOPI_TIL_FAGOMRADE"
          | "FEILFORE_SAK"
          | "INNG_TIL_UTG_DOKUMENT"
          | "OVERFOR_TIL_ANNEN_ENHET"
          | "SLETT_JOURNALPOST"
          | "TREKK_JOURNALPOST"
          | "REGISTRER_RETUR"
          | "MANGLER_ADRESSE"
          | "BESTILL_NY_DISTRIBUSJON"
          | "FARSKAP_UTELUKKET"
        )[]
      >({
        path: `/api/forsendelse/journal/${forsendelseIdMedPrefix}/avvik`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags avvik-kontroller
     * @name UtforAvvik
     * @summary Utfør avvikshåndtering
     * @request POST:/api/forsendelse/journal/{forsendelseIdMedPrefix}/avvik
     * @secure
     */
    utforAvvik: (forsendelseIdMedPrefix: string, data: Avvikshendelse, params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/api/forsendelse/journal/${forsendelseIdMedPrefix}/avvik`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Bestill distribusjon av forsendelse
     *
     * @tags distribusjon-kontroller
     * @name DistribuerForsendelse
     * @request POST:/api/forsendelse/journal/distribuer/{forsendelseIdMedPrefix}
     * @secure
     */
    distribuerForsendelse: (
      forsendelseIdMedPrefix: string,
      data: DistribuerJournalpostRequest,
      query?: {
        batchId?: string;
        ingenDistribusjon?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<DistribuerJournalpostResponse, DistribuerJournalpostResponse>({
        path: `/api/forsendelse/journal/distribuer/${forsendelseIdMedPrefix}`,
        method: "POST",
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Sjekk status på dokumentene i en enkel forsendelse og oppdater status hvis det er ute av synk. Dette skal brukes hvis feks en dokument er ferdigstilt i midlertidlig brevlager men status i databasen er fortsatt "under redigering" Denne tjenesten vil sjekke om dokumentet er ferdigstilt og oppdatere status hvis det er det. Bruk denne tjenesten istedenfor å oppdatere databasen direkte da ferdigstilt notat blir automatisk arkivert i Joark.
     *
     * @tags admin-controller
     * @name SynkForsendelseDistribusjonStatusForAlle
     * @summary Sjekk status på dokumentene i en enkel forsendelse og oppdater status hvis det er ute av synk
     * @request POST:/api/forsendelse/internal/synkForsendelseDistribusjonStatus
     * @secure
     */
    synkForsendelseDistribusjonStatusForAlle: (params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/api/forsendelse/internal/synkForsendelseDistribusjonStatus`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Sjekk status på dokumentene i en enkel forsendelse og oppdater status hvis det er ute av synk. Dette skal brukes hvis feks en dokument er ferdigstilt i midlertidlig brevlager men status i databasen er fortsatt "under redigering" Denne tjenesten vil sjekke om dokumentet er ferdigstilt og oppdatere status hvis det er det. Bruk denne tjenesten istedenfor å oppdatere databasen direkte da ferdigstilt notat blir automatisk arkivert i Joark.
     *
     * @tags admin-controller
     * @name SynkForsendelseDistribusjonStatus
     * @summary Sjekk status på dokumentene i en enkel forsendelse og oppdater status hvis det er ute av synk
     * @request POST:/api/forsendelse/internal/synkForsendelseDistribusjonStatus/{forsendelseId}
     * @secure
     */
    synkForsendelseDistribusjonStatus: (forsendelseId: string, params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/api/forsendelse/internal/synkForsendelseDistribusjonStatus/${forsendelseId}`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Sjekk status på dokumentene i forsendelse og oppdater status hvis det er ute av synk. Dette skal brukes hvis feks en dokument er ferdigstilt i midlertidlig brevlager men status i databasen er fortsatt "under redigering" Denne tjenesten vil sjekke om dokumentet er ferdigstilt og oppdatere status hvis det er det. Bruk denne tjenesten istedenfor å oppdatere databasen direkte da ferdigstilt notat blir automatisk arkivert i Joark.
     *
     * @tags admin-controller
     * @name SjekkOgOppdaterStatus
     * @summary Sjekk status på dokumentene i forsendelser og oppdater status hvis det er ute av synk
     * @request POST:/api/forsendelse/internal/sjekkOgOppdaterStatus
     * @secure
     */
    sjekkOgOppdaterStatus: (
      query?: {
        /**
         * @format int32
         * @default 100
         */
        limit?: number;
        /**
         * @format date
         * @example "2023-11-01"
         */
        afterDate?: string;
        /**
         * @format date
         * @example "2023-12-31"
         */
        beforeDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>[], any>({
        path: `/api/forsendelse/internal/sjekkOgOppdaterStatus`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Sjekk status på dokumentene i en enkel forsendelse og oppdater status hvis det er ute av synk. Dette skal brukes hvis feks en dokument er ferdigstilt i midlertidlig brevlager men status i databasen er fortsatt "under redigering" Denne tjenesten vil sjekke om dokumentet er ferdigstilt og oppdatere status hvis det er det. Bruk denne tjenesten istedenfor å oppdatere databasen direkte da ferdigstilt notat blir automatisk arkivert i Joark.
     *
     * @tags admin-controller
     * @name SjekkOgOppdaterStatus1
     * @summary Sjekk status på dokumentene i en enkel forsendelse og oppdater status hvis det er ute av synk
     * @request POST:/api/forsendelse/internal/sjekkOgOppdaterStatus/{forsendelseId}
     * @secure
     */
    sjekkOgOppdaterStatus1: (
      forsendelseId: string,
      query?: {
        /** @default false */
        oppdaterStatus?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<any, Record<string, string>[]>({
        path: `/api/forsendelse/internal/sjekkOgOppdaterStatus/${forsendelseId}`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Resynk distribusjonkanal. Hvis forsendelse er distribuert via nav.no og mottaker ikke har åpnet dokumentet i løpet av 48 timer vil forsendelsen bli redistribuert via sentral print. Denne tjenesten trigger en resynk av alle forsendelser som er sendt via nav.no for å oppdatere til riktig distribusjonstatus. Dette kjøres også som en egen skedulert jobb.
     *
     * @tags admin-controller
     * @name DistTilNavNoMenHarKanalSentralPrint
     * @summary Resynk distribusjonkanal for forsendelser som er distribuert via nav.no
     * @request POST:/api/forsendelse/internal/distribusjon/navno
     * @secure
     */
    distTilNavNoMenHarKanalSentralPrint: (
      query?: {
        /** @default true */
        simulering?: boolean;
        /**
         * @format date
         * @example "2023-11-01"
         */
        afterDate?: string;
        /**
         * @format date
         * @example "2023-12-31"
         */
        beforeDate?: string;
        sjekketNavNoRedistribusjonTilSentralPrint?: boolean;
        /** @format int32 */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>[], any>({
        path: `/api/forsendelse/internal/distribusjon/navno`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Resynk distribusjonkanal. Hvis forsendelse er distribuert via nav.no og mottaker ikke har åpnet dokumentet i løpet av 48 timer vil forsendelsen bli redistribuert via sentral print. Denne tjenesten trigger en resynk av alle forsendelser som er sendt via nav.no for å oppdatere til riktig distribusjonstatus. Dette kjøres også som en egen skedulert jobb.
     *
     * @tags admin-controller
     * @name DistTilNavNoMenHarKanalSentralPrintForForsendelse
     * @summary Resynk distribusjonkanal for forsendelse
     * @request POST:/api/forsendelse/internal/distribusjon/navno/{forsendelseId}
     * @secure
     */
    distTilNavNoMenHarKanalSentralPrintForForsendelse: (
      forsendelseId: number,
      query?: {
        /** @default true */
        simulering?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>, any>({
        path: `/api/forsendelse/internal/distribusjon/navno/${forsendelseId}`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentDokumentValg
     * @request POST:/api/forsendelse/dokumentvalg
     * @secure
     */
    hentDokumentValg: (data: HentDokumentValgRequest, params: RequestParams = {}) =>
      this.request<Record<string, DokumentMalDetaljer>, any>({
        path: `/api/forsendelse/dokumentvalg`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentDokumentValgV2
     * @request POST:/api/forsendelse/dokumentvalgV2
     * @secure
     */
    hentDokumentValgV2: (data: HentDokumentValgRequest, params: RequestParams = {}) =>
      this.request<HentDokumentValgResponse, any>({
        path: `/api/forsendelse/dokumentvalgV2`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentDokumentValgNotaterGet
     * @request GET:/api/forsendelse/dokumentvalg/notat
     * @deprecated
     * @secure
     */
    hentDokumentValgNotaterGet: (params: RequestParams = {}) =>
      this.request<Record<string, DokumentMalDetaljer>, any>({
        path: `/api/forsendelse/dokumentvalg/notat`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentDokumentValgNotater
     * @request POST:/api/forsendelse/dokumentvalg/notat
     * @secure
     */
    hentDokumentValgNotater: (data: HentDokumentValgRequest, params: RequestParams = {}) =>
      this.request<Record<string, DokumentMalDetaljer>, any>({
        path: `/api/forsendelse/dokumentvalg/notat`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Hent forsendelse med forsendelseid
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentForsendelse
     * @request GET:/api/forsendelse/{forsendelseIdMedPrefix}
     * @secure
     */
    hentForsendelse: (
      forsendelseIdMedPrefix: string,
      query?: {
        /** journalposten tilhører sak */
        saksnummer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<any, ForsendelseResponsTo>({
        path: `/api/forsendelse/${forsendelseIdMedPrefix}`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags endre-forsendelse-kontroller
     * @name OppdaterForsendelse
     * @summary Endre forsendelse
     * @request PATCH:/api/forsendelse/{forsendelseIdMedPrefix}
     * @secure
     */
    oppdaterForsendelse: (
      forsendelseIdMedPrefix: string,
      data: OppdaterForsendelseForesporsel,
      params: RequestParams = {},
    ) =>
      this.request<OppdaterForsendelseResponse, OppdaterForsendelseResponse>({
        path: `/api/forsendelse/${forsendelseIdMedPrefix}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags endre-forsendelse-kontroller
     * @name OppdaterDokument
     * @summary Oppdater dokument i en forsendelsee
     * @request PATCH:/api/forsendelse/{forsendelseIdMedPrefix}/dokument/{dokumentreferanse}
     * @secure
     */
    oppdaterDokument: (
      forsendelseIdMedPrefix: string,
      dokumentreferanse: string,
      data: OppdaterDokumentForesporsel,
      params: RequestParams = {},
    ) =>
      this.request<DokumentRespons, any>({
        path: `/api/forsendelse/${forsendelseIdMedPrefix}/dokument/${dokumentreferanse}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name HentDokumentRedigeringMetadata
     * @summary Hent dokument redigering metadata
     * @request GET:/api/forsendelse/redigering/{forsendelseIdMedPrefix}/{dokumentreferanse}
     * @secure
     */
    hentDokumentRedigeringMetadata: (
      forsendelseIdMedPrefix: string,
      dokumentreferanse: string,
      params: RequestParams = {},
    ) =>
      this.request<DokumentRedigeringMetadataResponsDto, DokumentRedigeringMetadataResponsDto>({
        path: `/api/forsendelse/redigering/${forsendelseIdMedPrefix}/${dokumentreferanse}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name OppdaterDokumentRedigeringmetadata
     * @summary Oppdater dokument redigeringdata
     * @request PATCH:/api/forsendelse/redigering/{forsendelseIdMedPrefix}/{dokumentreferanse}
     * @secure
     */
    oppdaterDokumentRedigeringmetadata: (
      forsendelseIdMedPrefix: string,
      dokumentreferanse: string,
      data: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/api/forsendelse/redigering/${forsendelseIdMedPrefix}/${dokumentreferanse}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name FerdigstillDokument
     * @summary Ferdigstill dokument i en forsendelse
     * @request PATCH:/api/forsendelse/redigering/{forsendelseIdMedPrefix}/{dokumentreferanse}/ferdigstill
     * @secure
     */
    ferdigstillDokument: (
      forsendelseIdMedPrefix: string,
      dokumentreferanse: string,
      data: FerdigstillDokumentRequest,
      params: RequestParams = {},
    ) =>
      this.request<DokumentRespons, any>({
        path: `/api/forsendelse/redigering/${forsendelseIdMedPrefix}/${dokumentreferanse}/ferdigstill`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags rediger-dokument-kontroller
     * @name OpphevFerdigstillDokument
     * @summary Ferdigstill dokument i en forsendelse
     * @request PATCH:/api/forsendelse/redigering/{forsendelseIdMedPrefix}/{dokumentreferanse}/ferdigstill/opphev
     * @secure
     */
    opphevFerdigstillDokument: (
      forsendelseIdMedPrefix: string,
      dokumentreferanse: string,
      params: RequestParams = {},
    ) =>
      this.request<DokumentRespons, any>({
        path: `/api/forsendelse/redigering/${forsendelseIdMedPrefix}/${dokumentreferanse}/ferdigstill/opphev`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent forsendelse med forsendelseid
     *
     * @tags forsendelse-journal-kontroller
     * @name HentForsendelse1
     * @request GET:/api/forsendelse/journal/{forsendelseIdMedPrefix}
     * @secure
     */
    hentForsendelse1: (
      forsendelseIdMedPrefix: string,
      query?: {
        /** journalposten tilhører sak */
        saksnummer?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<any, JournalpostResponse>({
        path: `/api/forsendelse/journal/${forsendelseIdMedPrefix}`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags endre-forsendelse-kontroller
     * @name OppdaterForsendelseLegacy
     * @summary Endre forsendelse
     * @request PATCH:/api/forsendelse/journal/{forsendelseIdMedPrefix}
     * @secure
     */
    oppdaterForsendelseLegacy: (
      forsendelseIdMedPrefix: string,
      data: EndreJournalpostCommand,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/api/forsendelse/journal/${forsendelseIdMedPrefix}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags dokument-kontroller
     * @name HentDokumentForReferanse
     * @summary Hent fysisk dokument som byte
     * @request GET:/api/forsendelse/dokumentreferanse/{dokumentreferanse}
     * @secure
     */
    hentDokumentForReferanse: (dokumentreferanse: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/forsendelse/dokumentreferanse/${dokumentreferanse}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags dokument-kontroller
     * @name HentDokumentMetadataForReferanse
     * @summary Hent metadata om dokument
     * @request OPTIONS:/api/forsendelse/dokumentreferanse/{dokumentreferanse}
     * @secure
     */
    hentDokumentMetadataForReferanse: (dokumentreferanse: string, params: RequestParams = {}) =>
      this.request<DokumentMetadata[], any>({
        path: `/api/forsendelse/dokumentreferanse/${dokumentreferanse}`,
        method: "OPTIONS",
        secure: true,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name StottedeDokumentmaler
     * @request OPTIONS:/api/forsendelse/dokumentmaler
     * @secure
     */
    stottedeDokumentmaler: (params: RequestParams = {}) =>
      this.request<string[], any>({
        path: `/api/forsendelse/dokumentmaler`,
        method: "OPTIONS",
        secure: true,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name StottedeDokumentmalDetaljer
     * @request OPTIONS:/api/forsendelse/dokumentmaler/detaljer
     * @secure
     */
    stottedeDokumentmalDetaljer: (params: RequestParams = {}) =>
      this.request<Record<string, DokumentMalDetaljer>, any>({
        path: `/api/forsendelse/dokumentmaler/detaljer`,
        method: "OPTIONS",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags dokument-kontroller
     * @name HentDokumentMetadata
     * @summary Hent metadata om dokument
     * @request OPTIONS:/api/forsendelse/dokument/{forsendelseIdMedPrefix}
     * @secure
     */
    hentDokumentMetadata: (forsendelseIdMedPrefix: string, params: RequestParams = {}) =>
      this.request<DokumentMetadata[], any>({
        path: `/api/forsendelse/dokument/${forsendelseIdMedPrefix}`,
        method: "OPTIONS",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags dokument-kontroller
     * @name HentDokument
     * @summary Hent fysisk dokument som byte
     * @request GET:/api/forsendelse/dokument/{forsendelseIdMedPrefix}/{dokumentreferanse}
     * @secure
     */
    hentDokument: (forsendelseIdMedPrefix: string, dokumentreferanse: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/forsendelse/dokument/${forsendelseIdMedPrefix}/${dokumentreferanse}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags dokument-kontroller
     * @name HentDokumentMetadata1
     * @summary Hent metadata om dokument
     * @request OPTIONS:/api/forsendelse/dokument/{forsendelseIdMedPrefix}/{dokumentreferanse}
     * @secure
     */
    hentDokumentMetadata1: (forsendelseIdMedPrefix: string, dokumentreferanse: string, params: RequestParams = {}) =>
      this.request<DokumentMetadata[], any>({
        path: `/api/forsendelse/dokument/${forsendelseIdMedPrefix}/${dokumentreferanse}`,
        method: "OPTIONS",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent alle forsendelse som har saksnummer
     *
     * @tags forsendelse-journal-kontroller
     * @name HentJournal
     * @request GET:/api/forsendelse/sak/{saksnummer}/journal
     * @secure
     */
    hentJournal: (
      saksnummer: string,
      query?: {
        fagomrade?: ("BID" | "FAR")[];
      },
      params: RequestParams = {},
    ) =>
      this.request<JournalpostDto[], any>({
        path: `/api/forsendelse/sak/${saksnummer}/journal`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Hent alle forsendelse med saksnummer
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentJournal1
     * @request GET:/api/forsendelse/sak/{saksnummer}/forsendelser
     * @secure
     */
    hentJournal1: (saksnummer: string, params: RequestParams = {}) =>
      this.request<ForsendelseResponsTo[], any>({
        path: `/api/forsendelse/sak/${saksnummer}/forsendelser`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent alle forsendelse som er opprettet før dagens dato og ikke er distribuert
     *
     * @tags forsendelse-journal-kontroller
     * @name HentForsendelserIkkeDistribuert
     * @request GET:/api/forsendelse/journal/ikkedistribuert
     * @secure
     */
    hentForsendelserIkkeDistribuert: (params: RequestParams = {}) =>
      this.request<ForsendelseIkkeDistribuertResponsTo[], any>({
        path: `/api/forsendelse/journal/ikkedistribuert`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags distribusjon-kontroller
     * @name HenStorrelsePaDokumenter
     * @summary Hent størrelse på dokumentene i forsendelsen
     * @request GET:/api/forsendelse/journal/distribuer/{forsendelseIdMedPrefix}/size
     * @secure
     */
    henStorrelsePaDokumenter: (forsendelseIdMedPrefix: string, params: RequestParams = {}) =>
      this.request<number, any>({
        path: `/api/forsendelse/journal/distribuer/${forsendelseIdMedPrefix}/size`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags distribusjon-kontroller
     * @name KanDistribuere
     * @summary Sjekk om forsendelse kan distribueres
     * @request GET:/api/forsendelse/journal/distribuer/{forsendelseIdMedPrefix}/enabled
     * @secure
     */
    kanDistribuere: (forsendelseIdMedPrefix: string, params: RequestParams = {}) =>
      this.request<string, string>({
        path: `/api/forsendelse/journal/distribuer/${forsendelseIdMedPrefix}/enabled`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent forsendelser som har ettersending som ikke er oppretttet
     *
     * @tags admin-controller
     * @name ForsendelserEttersendingIkkeOpprettet
     * @summary Sjekk status på dokumentene i forsendelser og oppdater status hvis det er ute av synk
     * @request GET:/api/forsendelse/internal/ettersendingIkkeOpprettet
     * @secure
     */
    forsendelserEttersendingIkkeOpprettet: (params: RequestParams = {}) =>
      this.request<Record<string, string>[], any>({
        path: `/api/forsendelse/internal/ettersendingIkkeOpprettet`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ettersendingsoppgave-controller
     * @name HentEksisterendeEttersendingsoppgaverForsendelse
     * @summary Hent ettersendingsoppgaver
     * @request GET:/api/forsendelse/ettersendingsoppgave/oppgaver/{forsendelseId}
     * @secure
     */
    hentEksisterendeEttersendingsoppgaverForsendelse: (forsendelseId: string, params: RequestParams = {}) =>
      this.request<Record<string, DokumentSoknadDto[]>, any>({
        path: `/api/forsendelse/ettersendingsoppgave/oppgaver/${forsendelseId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentDokumentValgForForsendelseV2
     * @request GET:/api/forsendelse/dokumentvalg/forsendelseV2/{forsendelseIdMedPrefix}
     * @secure
     */
    hentDokumentValgForForsendelseV2: (forsendelseIdMedPrefix: string, params: RequestParams = {}) =>
      this.request<HentDokumentValgResponse, any>({
        path: `/api/forsendelse/dokumentvalg/forsendelseV2/${forsendelseIdMedPrefix}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Henter dokumentmaler som er støttet av applikasjonen
     *
     * @tags forsendelse-innsyn-kontroller
     * @name HentDokumentValgForForsendelse
     * @request GET:/api/forsendelse/dokumentvalg/forsendelse/{forsendelseIdMedPrefix}
     * @secure
     */
    hentDokumentValgForForsendelse: (forsendelseIdMedPrefix: string, params: RequestParams = {}) =>
      this.request<Record<string, DokumentMalDetaljer>, any>({
        path: `/api/forsendelse/dokumentvalg/forsendelse/${forsendelseIdMedPrefix}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags endre-forsendelse-kontroller
     * @name FjernDokumentFraForsendelse
     * @summary Slett dokument fra forsendelse
     * @request DELETE:/api/forsendelse/{forsendelseIdMedPrefix}/{dokumentreferanse}
     * @secure
     */
    fjernDokumentFraForsendelse: (
      forsendelseIdMedPrefix: string,
      dokumentreferanse: string,
      params: RequestParams = {},
    ) =>
      this.request<OppdaterForsendelseResponse, any>({
        path: `/api/forsendelse/${forsendelseIdMedPrefix}/${dokumentreferanse}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ettersendingsoppgave-controller
     * @name SlettEttersendingsoppgaveVedlegg
     * @summary Oppretter ny varsel ettersendelse
     * @request DELETE:/api/forsendelse/ettersendingsoppgave/dokument
     * @secure
     */
    slettEttersendingsoppgaveVedlegg: (data: SlettEttersendingsoppgaveVedleggRequest, params: RequestParams = {}) =>
      this.request<EttersendingsoppgaveDto, EttersendingsoppgaveDto>({
        path: `/api/forsendelse/ettersendingsoppgave/dokument`,
        method: "DELETE",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
}
