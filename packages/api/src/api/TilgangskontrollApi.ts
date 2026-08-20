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

export interface TilgangTilTemaRequest {
  tema: string;
  navIdent?: string | null;
}

export interface TilgangskontrollResponse {
  /** Indikerer om brukeren har tilgang. Hvis tilgang er avslått, vil detaljer inneholde mer informasjon. */
  harTilgang: boolean;
  /** Liste over detaljer om tilgangsbeslutninger, inkludert opprinnelse og begrunnelse. Vil kun settes om tilgang avslås. */
  detaljer: TilgangskontrollResponseDetaljer[];
}

export interface TilgangskontrollResponseDetaljer {
  harTilgang: boolean;
  begrunnelse: string;
  opprinnelseTilgangsbeslutning: "TILGANGSMASKIN" | "GRAPH" | "BIDRAG_SAK_PIP" | "BIDRAG_TILGANGSKONTROLL";
}

export interface TilgangTilSakRequest {
  saksnummer: string;
}

export interface TilgangTilPersonRequest {
  personident: string;
}

export enum Behandlingstema {
  AVSKRIVNING = "AVSKRIVNING",
  BIDRAG = "BIDRAG",
  BIDRAG_PLUSS_TILLEGGSBIDRAG = "BIDRAG_PLUSS_TILLEGGSBIDRAG",
  DIREKTEOPPGJOR = "DIREKTE_OPPGJØR",
  EKTEFELLEBIDRAG = "EKTEFELLEBIDRAG",
  ETTERGIVELSE = "ETTERGIVELSE",
  ERSTATNING = "ERSTATNING",
  FARSSKAP = "FARSSKAP",
  KUNNSKAP_OM_BIOLOGISK_FAR = "KUNNSKAP_OM_BIOLOGISK_FAR",
  FORSKUDD = "FORSKUDD",
  GEBYR = "GEBYR",
  INNKREVING = "INNKREVING",
  MORSSKAP = "MORSSKAP",
  MOTREGNING = "MOTREGNING",
  OPPFOSTRINGSBIDRAG = "OPPFOSTRINGSBIDRAG",
  REFUSJON_BIDRAG = "REFUSJON_BIDRAG",
  SAKSOMKOSTNINGER = "SAKSOMKOSTNINGER",
  SAeRBIDRAG = "SÆRBIDRAG",
  TILLEGGSBIDRAG = "TILLEGGSBIDRAG",
  TILBAKEKREVING_ETTERGIVELSE = "TILBAKEKREVING_ETTERGIVELSE",
  TILBAKEKREVING = "TILBAKEKREVING",
  TILBAKEKREVING_BIDRAG = "TILBAKEKREVING_BIDRAG",
  BIDRAG18ARPLUSSTILLEGGSBIDRAG = "BIDRAG_18_ÅR_PLUSS_TILLEGGSBIDRAG",
  BIDRAG18AR = "BIDRAG_18_ÅR",
  REISEKOSTNADER = "REISEKOSTNADER",
}

/** Brukertilganger for en bruker */
export interface Brukertilganger {
  /** Indikerer om brukeren har tilgang til Bisys. */
  bisysTilgang: boolean;
  /** Indikerer om brukeren har tilgang til utlandssaker. */
  utlandTilgang: boolean;
  /** Indikerer om brukeren har tilgang til å lese saker. */
  leseSakTilgang: boolean;
  /** Indikerer om brukeren har tilgang til å behandle saker. */
  behandleSakTilgang: boolean;
  /** Indikerer om brukeren har tilgang til foreldreskapssaker. */
  foreldreskapTilgang: boolean;
  /** Indikerer om brukeren har administrativ tilgang. */
  administrasjonTilgang: boolean;
  /** Liste over behandlingstemaer brukeren har tilgang til. */
  behandlingstemaer: Behandlingstema[];
}

export interface SporingsdataSakRequest {
  saksnummer: string;
}

export interface PairStringString {
  first: string;
  second: string;
}

/** Sporingdata til auditlogging */
export interface Sporingsdata {
  /** Fødselsnummer på primærpersonen i oppslaget. */
  personIdent: string;
  /** Hvor vist personen som gjør oppslaget har tilgang til å gjøre oppslaget. */
  tilgang: boolean;
  /** Ekstrainformasjonsfelter. Navn og verdi. Eksempelvis mapOf("saksnummer" to "2302845") */
  ekstrafelter: PairStringString[];
}

export interface SporingsdataPersonRequest {
  personIdent: string;
}

export interface BehandlingstemaRequest {
  behandlingstemaer: Behandlingstema[];
}

export interface BrukerEnheterRespons {
  enhetIder: string[];
}

export interface Brukerinformasjon {
  displayName?: string;
  givenName?: string;
  jobTitle?: string;
  mail?: string;
  officeLocation?: string;
  surname?: string;
  id?: string | null;
  onPremisesSamAccountName?: string | null;
}

export interface BrukerinformasjonResponse {
  "@odata.nextLink"?: string;
  value?: any[] | null;
}

export interface BrukerGrupperResponse {
  value?: any[] | null;
}

export interface Gruppe {
  id?: string | null;
  description?: string;
  displayName?: string;
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
      baseURL: axiosConfig.baseURL || "https://bidrag-tilgangskontroll.intern.dev.nav.no",
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
 * @title bidrag-tilgangskontroll
 * @version v1
 * @baseUrl https://bidrag-tilgangskontroll.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  v2 = {
    /**
     * @description Kontrollerer om saksbehandler har tilgang til et spesifikt fagtema (f.eks. BID, FAR). Validerer at brukerens AD-grupper gir rettigheter til det angitte temaet.
     *
     * @tags Tilgangskontroll
     * @name SjekkTilgangTema
     * @summary Sjekk tilgang til fagtema
     * @request POST:/v2/api/tilgang/tema
     * @secure
     */
    sjekkTilgangTema: (data: TilgangTilTemaRequest, params: RequestParams = {}) =>
      this.request<TilgangskontrollResponse, void>({
        path: `/v2/api/tilgang/tema`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Kontrollerer om saksbehandler har tilgang til en spesifikk søknadsgruppe (barnebortføring, ektefellebidrag, oppfostringsbidrag eller reiseutgifter). Tilgang avgjøres av hvilken enhet saksbehandleren tilhører.
     *
     * @tags Tilgangskontroll
     * @name SjekkTilgangSoknadsgrupper
     * @summary Sjekk tilgang til søknadsgruppe
     * @request POST:/v2/api/tilgang/soknadsgrupper
     * @secure
     */
    sjekkTilgangSoknadsgrupper: (
      query: {
        /** Søknadsgruppe det skal sjekkes tilgang for */
        søknadsgruppe: "BARNEBORTFØRING" | "EKTEFELLEBIDRAG" | "OPPFOSTRINGSBIDRAG" | "REISEUTGIFTER";
        /**
         * NAV-ident. Valgfri — utledes fra token om ikke oppgitt.
         * @example "Z999999"
         */
        navident?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<TilgangskontrollResponse, void>({
        path: `/v2/api/tilgang/soknadsgrupper`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Kontrollerer om innlogget saksbehandler har tilgang til en gitt bidragssak. Sjekker blant annet enhetstilgang, skjermingsstatus og adressebeskyttelse på involverte parter.
     *
     * @tags Tilgangskontroll
     * @name SjekkTilgangSakV2
     * @summary Sjekk tilgang til sak
     * @request POST:/v2/api/tilgang/sak
     * @secure
     */
    sjekkTilgangSakV2: (data: TilgangTilSakRequest, params: RequestParams = {}) =>
      this.request<TilgangskontrollResponse, void>({
        path: `/v2/api/tilgang/sak`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Kontrollerer om innlogget saksbehandler har tilgang til å se opplysninger om en person. Sjekker skjermingsstatus (egen ansatt), adressebeskyttelse (kode 6/7) og diskresjonskoder.
     *
     * @tags Tilgangskontroll
     * @name SjekkTilgangPerson
     * @summary Sjekk tilgang til person
     * @request POST:/v2/api/tilgang/person
     * @secure
     */
    sjekkTilgangPerson: (data: TilgangTilPersonRequest, params: RequestParams = {}) =>
      this.request<TilgangskontrollResponse, void>({
        path: `/v2/api/tilgang/person`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Kontrollerer om innlogget saksbehandler har tilgang til å opprette en bidragssak uten bidragsmottaker (BM), altså kun med bidragspliktig (BP) og barn. Krever spesifikke AD-gruppemedlemskap.
     *
     * @tags Tilgangskontroll
     * @name SjekkTilgangOpprettSakUtenBm
     * @summary Sjekk tilgang til å opprette sak uten bidragsmottaker
     * @request POST:/v2/api/tilgang/opprettsakutenbm
     * @secure
     */
    sjekkTilgangOpprettSakUtenBm: (params: RequestParams = {}) =>
      this.request<TilgangskontrollResponse, void>({
        path: `/v2/api/tilgang/opprettsakutenbm`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Henter en samlet oversikt over alle tilganger for innlogget saksbehandler, inkludert Bisys-tilgang, utlandstilgang, lese-/behandletilgang, foreldreskapstilgang og tilgjengelige behandlingstemaer.
     *
     * @tags Tilgangskontroll
     * @name HentBrukertilganger
     * @summary Hent brukertilganger
     * @request POST:/v2/api/tilgang/brukertilganger
     * @secure
     */
    hentBrukertilganger: (params: RequestParams = {}) =>
      this.request<Brukertilganger, void>({
        path: `/v2/api/tilgang/brukertilganger`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Henter sporingsdata for en bidragssak som brukes til auditlogging. Returnerer personident for primærperson i saken, tilgangsstatus og relevante ekstrafelter (f.eks. saksnummer).
     *
     * @tags Sporingsdata
     * @name HentSakSporingsdata
     * @summary Hent sporingsdata for sak
     * @request POST:/v2/api/sporingsdata/sak
     * @secure
     */
    hentSakSporingsdata: (data: SporingsdataSakRequest, params: RequestParams = {}) =>
      this.request<Sporingsdata, void>({
        path: `/v2/api/sporingsdata/sak`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Henter sporingsdata for en person som brukes til auditlogging. Returnerer personident, tilgangsstatus og relevante ekstrafelter.
     *
     * @tags Sporingsdata
     * @name HentPersonSporingsdata
     * @summary Hent sporingsdata for person
     * @request POST:/v2/api/sporingsdata/person
     * @secure
     */
    hentPersonSporingsdata: (data: SporingsdataPersonRequest, params: RequestParams = {}) =>
      this.request<Sporingsdata, void>({
        path: `/v2/api/sporingsdata/person`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Kontrollerer om innlogget saksbehandler har tilgang til å behandle (opprette/endre vedtak) for de oppgitte behandlingstemaene. Krever høyere tilgangsnivå enn lesetilgang.
     *
     * @tags Behandlingstilgang
     * @name SjekkbehandlingstilgangBehandlingstema
     * @summary Sjekk skrivetilgang for behandlingstema
     * @request POST:/v2/api/behandlingstilgang/skriv
     * @secure
     */
    sjekkbehandlingstilgangBehandlingstema: (data: BehandlingstemaRequest, params: RequestParams = {}) =>
      this.request<TilgangskontrollResponse, void>({
        path: `/v2/api/behandlingstilgang/skriv`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Kontrollerer om innlogget saksbehandler har lesetilgang til de oppgitte behandlingstemaene. Validerer brukerens AD-gruppemedlemskap mot tilgangskrav for hvert tema.
     *
     * @tags Behandlingstilgang
     * @name SjekkLesetilgangBehandlingstema
     * @summary Sjekk lesetilgang for behandlingstema
     * @request POST:/v2/api/behandlingstilgang/les
     * @secure
     */
    sjekkLesetilgangBehandlingstema: (data: BehandlingstemaRequest, params: RequestParams = {}) =>
      this.request<TilgangskontrollResponse, void>({
        path: `/v2/api/behandlingstilgang/les`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Henter alle NAV-enheter som en saksbehandler tilhører. Hvis navident ikke oppgis, brukes identiteten fra innlogget token.
     *
     * @tags Tilgangskontroll
     * @name HentEnheterForBruker
     * @summary Hent enheter for bruker
     * @request GET:/v2/api/tilgang/enheter
     * @secure
     */
    hentEnheterForBruker: (
      query?: {
        /**
         * NAV-ident til saksbehandleren. Valgfri — utledes fra token om ikke oppgitt.
         * @example "Z999999"
         */
        navident?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BrukerEnheterRespons, void>({
        path: `/v2/api/tilgang/enheter`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Henter alle saksbehandlere som er tilknyttet en gitt NAV-enhet via Microsoft Graph API.
     *
     * @tags Tilgangskontroll
     * @name HentBrukereForEnhet
     * @summary Hent brukere tilknyttet enhet
     * @request GET:/v2/api/tilgang/enhet
     * @secure
     */
    hentBrukereForEnhet: (
      query: {
        /**
         * NAV-enhetsnummer
         * @example 4806
         */
        enhet: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BrukerinformasjonResponse, void>({
        path: `/v2/api/tilgang/enhet`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Tømmer spesifisert cache-type. Brukes ved feilsøking eller når tilgangsdata må oppdateres umiddelbart.
     *
     * @tags Tilgangskontroll
     * @name TomCache
     * @summary Tøm cache
     * @request GET:/v2/api/tilgang/cache/clear
     * @secure
     */
    tomCache: (
      query: {
        /** Type cache som skal tømmes */
        cacheType:
          | "PIP_SAK"
          | "TILGANGSMASKIN_KJERNEREGLER"
          | "TILGANGSMASKIN_KJERNEREGLER_BULK"
          | "TILGANGSMASKIN_KOMPLETTEREGLER"
          | "TILGANGSMASKIN_KOMPLETTEREGLER_BULK"
          | "TEMA"
          | "BRUKERGRUPPER";
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v2/api/tilgang/cache/clear`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Henter detaljert brukerinformasjon (navn, e-post, avdeling, jobbtittel) for en saksbehandler fra Microsoft Graph API.
     *
     * @tags Tilgangskontroll
     * @name HentBrukerinformasjon
     * @summary Hent brukerinformasjon
     * @request GET:/v2/api/tilgang/brukerinformasjon
     * @secure
     */
    hentBrukerinformasjon: (
      query: {
        /**
         * NAV-ident til saksbehandleren
         * @example "Z999999"
         */
        navident: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BrukerinformasjonResponse, void>({
        path: `/v2/api/tilgang/brukerinformasjon`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Henter alle Azure AD-grupper som en saksbehandler er medlem av via Microsoft Graph API. Brukes for å kartlegge brukerens tilganger og roller.
     *
     * @tags Tilgangskontroll
     * @name HentBrukergrupper
     * @summary Hent brukerens AD-grupper
     * @request GET:/v2/api/tilgang/brukergrupper
     * @secure
     */
    hentBrukergrupper: (
      query: {
        /**
         * NAV-ident til saksbehandleren
         * @example "Z999999"
         */
        navident: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BrukerGrupperResponse, void>({
        path: `/v2/api/tilgang/brukergrupper`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),
  };
}
