/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Adresse {
  /**
   * Trykkes på førstesiden
   * @example "Gateveien 1"
   */
  adresselinje1: string;
  /** Trykkes på førstesiden */
  adresselinje2?: string;
  /** Trykkes på førstesiden */
  adresselinje3?: string;
  /**
   * Trykkes på førstesiden
   * @example "1234"
   */
  postnummer: string;
  /**
   * Trykkes på førstesiden
   * @example "Oslo"
   */
  poststed: string;
}

export interface Arkivsak {
  /**
   * "PSAK" for forsendelser med tema PEN eller UFO. "GSAK" for alle andre tema.
   * @example "GSAK"
   */
  arkivsaksystem: "GSAK" | "PSAK";
  /**
   * Saksnummeret i GSAK eller PSAK. Kan kun inneholde siffer og bokstaver
   * @example "abc123456"
   */
  arkivsaksnummer: string;
}

export interface Avsender {
  /**
   * Avsenders fødselsnummer eller personnummer. Kan kun inneholde siffer
   * @example "01234567890"
   */
  avsenderId?: string;
  /**
   * Navn på avsender
   * @example "Per Hansen"
   */
  avsenderNavn?: string;
}

export interface Bruker {
  /**
   * Fødselsnummeret eller organisasjonsnummeret som dokumentene omhandler. Fødselsnummeret vil bli trykket i klartekst på førstesiden. Kan kun inneholde siffer
   * @example "01234567890"
   */
  brukerId: string;
  /**
   * Typen bruker. Gyldige verdier er:
   * * PERSON
   * * ORGANISASJON
   * @example "PERSON"
   */
  brukerType: "PERSON" | "ORGANISASJON";
}

export interface PostFoerstesideRequest {
  /**
   * Målformen førstesiden skal produseres på.
   *
   * Gyldige verdier er NB, NN og EN.
   *
   * Default verdi er NB
   * @default "NB"
   * @example "NB"
   */
  spraakkode: "NB" | "NN" | "EN";
  /**
   * Adressen som brukeren skal sende dokumentene til. Adressen blir trykket på førstesiden.
   * Dersom dokumentene skal sendes til primærskanningleverandør (idag NETS), kan konsument velge å la adressefeltet stå blankt, og kun oppgi postboks. Resten av adressen blir da fylt ut automatisk.
   */
  adresse?: Adresse;
  /**
   * Postboksen hos hovedskanningleverandør (idag NETS) som dokumentene skal sendes til. Kan kun inneholde siffer.
   * "NB: Dersom adresse ikke er oppgitt, er postboks påkrevd, og vil bli brukt til å generere en korrekt adresse.
   * @example "1234"
   */
  netsPostboks?: string;
  /** Avsender av dokumentene */
  avsender?: Avsender;
  /** Personen eller organisasjonen som dokumentene gjelder */
  bruker?: Bruker;
  /**
   * Kan settes dersom man ikke kjenner brukerens fødselsnummer, men har noe informasjon om brukeren som kan være relevant når en saksbehandler skal finne ut hvor saken skal behandles. Dette kan være brukerens navn eller informasjon om hvilket NAV-kontor han/hun har vært innom.
   * ukjentBrukerPersoninfo trykkes nederst på førstesiden.
   */
  ukjentBrukerPersoninfo?: string;
  /**
   * Temaet for forsendelsen, for eksempel FOR (Foreldrepenger), SYK (Sykepenger) eller BID (bidrag).
   * Tjenesten vil validere at konsument oppgir et gyldig tema for arkivering.
   * @example "FOR"
   */
  tema?: string;
  /**
   * Behandlingstema for forsendelsen, for eksempel ab0001 (Ordinære dagpenger).
   * "NB: Koden skal oppgis, ikke dekoden.
   * @example "ab0001"
   */
  behandlingstema?: string;
  /**
   * Tittelen det skannede dokumentet skal få i journalen. For eksempel "Søknad om foreldrepenger ved fødsel" eller "Ettersendelse til søknad om foreldrepenger ved fødsel".
   * Arkivtittelen vil, såfremt den ikke blir endret under journalføring, vises frem i brukers journal på nav.no, samt til saksbehandler i fagsystemer som Gosys og Modia.
   * Arkivtittel skal oppgis på norsk (bokmål).
   * @example "Søknad om foreldrepenger ved fødsel"
   */
  arkivtittel?: string;
  /**
   * Liste over vedlegg avsender skal sende inn.
   * NB: Selve skjemaet skal ikke inngå i vedleggslisten.
   * Arkivtittel på et vedlegg som skal sendes inn, for eksempel "Terminbekreftelse" eller "Dokumentasjon av inntekt".
   * Tittel skal oppgis på norsk (bokmål).
   * @example "[Terminbekreftelse, Dokumentasjon av inntekt]"
   */
  vedleggsliste?: string[];
  /**
   * Identifikator på skjema som er valgt.
   * "NAV-skjemaID skal oppgis på format "NAV 14.05-07" uavhengig av om forsendelsen er en søknad eller ettersendelse.
   * @example "NAV 14.05-07"
   */
  navSkjemaId?: string;
  /**
   * Teksten som skal trykkes som overskrift på førstesiden. Overskriften kan oppgis på brukers eget språk (bokmål, nynorsk eller engelsk).
   * @example ""Søknad om foreldrepenger ved fødsel - NAV 14.05-07""
   */
  overskriftstittel: string;
  /**
   * Alt som skal trykkes på førstesiden under "Send inn følgende dokumenter".
   * Tittel på et dokument som skal sendes inn, for eksempel "Søknad om foreldrepenger ved fødsel", "Terminbekreftelse" eller "Dokumentasjon av inntekt".
   * Titlene kan oppgis på brukers eget språk (bokmål, nynorsk eller engelsk)
   * @example "[Søknad om foreldrepenger ved fødsel, Terminbekreftelse, Dokumentasjon av inntekt]"
   */
  dokumentlisteFoersteside?: string[];
  /**
   * Sier hvorvidt forsendelsen er et NAV-skjema, NAV-internt, en ettersendelse til et skjema, eller løspost (altså frittstående dokumentasjon som ikke er knyttet til et skjema).
   * Foerstesidetypen styrer hvilken brevkode journalposten får i arkivet.
   * @example "SKJEMA"
   */
  foerstesidetype: "ETTERSENDELSE" | "LOESPOST" | "SKJEMA" | "NAV_INTERN";
  /**
   * NAV-enheten som dokumentene skal rutes til for journalføring og/eller saksbehandling. Kan kun inneholde siffer.
   * Feltet skal kun benyttes dersom det er behov for å overstyre fagsystemets egne rutingregler. Dette kan feks være dersom avsender vet bedre enn NAV hvilken enhet som skal motta dokumentene.
   * @example "9999"
   */
  enhetsnummer?: string;
  /** Saken i GSAK/PSAK som journalposten skal knyttes til. */
  arkivsak?: Arkivsak;
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

export interface HttpHeaders {
  empty?: boolean;
  /** @format uri */
  location?: string;
  host?: {
    address?: {
      /** @format byte */
      address?: Blob;
      hostAddress?: string;
      linkLocalAddress?: boolean;
      hostName?: string;
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
    hostName?: string;
    hostString?: string;
    unresolved?: boolean;
  };
  all?: Record<string, string>;
  /** @format int64 */
  lastModified?: number;
  /** @format int64 */
  date?: number;
  /** @format int64 */
  contentLength?: number;
  acceptCharset?: string[];
  contentDisposition?: ContentDisposition;
  range?: HttpRange[];
  connection?: string[];
  origin?: string;
  /** @uniqueItems true */
  allow?: HttpMethod[];
  cacheControl?: string;
  contentLanguage?: string;
  etag?: string;
  acceptLanguage?: {
    range?: string;
    /** @format double */
    weight?: number;
  }[];
  basicAuth?: string;
  accept?: MediaType[];
  acceptLanguageAsLocales?: string[];
  acceptPatch?: MediaType[];
  accessControlAllowCredentials?: boolean;
  accessControlAllowHeaders?: string[];
  accessControlAllowMethods?: HttpMethod[];
  accessControlAllowOrigin?: string;
  accessControlExposeHeaders?: string[];
  /** @format int64 */
  accessControlMaxAge?: number;
  accessControlRequestHeaders?: string[];
  accessControlRequestMethod?: HttpMethod;
  bearerAuth?: string;
  /** @format int64 */
  expires?: number;
  ifMatch?: string[];
  ifNoneMatch?: string[];
  /** @format int64 */
  ifUnmodifiedSince?: number;
  pragma?: string;
  upgrade?: string;
  vary?: string[];
  contentType?: MediaType;
  /** @format int64 */
  ifModifiedSince?: number;
}

export type HttpMethod = any;

export type HttpRange = any;

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

export interface PostFoerstesideResponse {
  /**
   * Førsteside pdf
   * @format byte
   */
  foersteside?: Blob;
  /** Løpenummer for førsteside */
  loepenummer?: string;
}

export interface FoerstesideResponse {
  /** Avsender av dokumentene */
  avsender?: Avsender;
  /** Personen eller organisasjonen som dokumentene gjelder */
  bruker?: Bruker;
  /**
   * Temaet for forsendelsen, for eksempel FOR (Foreldrepenger), SYK (Sykepenger) eller BID (bidrag).
   * Tjenesten vil validere at konsument oppgir et gyldig tema for arkivering.
   * @example "FOR"
   */
  tema?: string;
  /**
   * Behandlingstema for forsendelsen, for eksempel ab0001 (Ordinære dagpenger).
   * "NB: Koden skal oppgis, ikke dekoden.
   * @example "ab0001"
   */
  behandlingstema?: string;
  /**
   * Tittelen det skannede dokumentet skal få i journalen. For eksempel "Søknad om foreldrepenger ved fødsel" eller "Ettersendelse til søknad om foreldrepenger ved fødsel".
   * Arkivtittelen vil, såfremt den ikke blir endret under journalføring, vises frem i brukers journal på nav.no, samt til saksbehandler i fagsystemer som Gosys og Modia.
   * Arkivtittel skal oppgis på norsk (bokmål).
   * @example "Ettersendelse til søknad om foreldrepenger ved fødsel"
   */
  arkivtittel?: string;
  /**
   * Liste over vedlegg avsender skal sende inn.
   * NB: Selve skjemaet skal ikke inngå i vedleggslisten.
   * Arkivtittel på et vedlegg som skal sendes inn, for eksempel "Terminbekreftelse" eller "Dokumentasjon av inntekt".
   * Tittel skal oppgis på norsk (bokmål).
   * @example "[Terminbekreftelse, Dokumentasjon av inntekt]"
   */
  vedleggsliste?: string[];
  /**
   * Identifikator på skjema som er valgt.
   * NAV-skjemaID skal oppgis på format "NAV 14.05-07" uavhengig av om forsendelsen er en søknad eller ettersendelse.
   * @example "NAV 14.05-07"
   */
  navSkjemaId?: string;
  /**
   * NAV-enheten som dokumentene skal rutes til for journalføring og/eller saksbehandling.
   * Feltet skal kun benyttes dersom det er behov for å overstyre fagsystemets egne rutingregler. Dette kan feks være dersom avsender vet bedre enn NAV hvilken enhet som skal motta dokumentene.
   * @example "9999"
   */
  enhetsnummer?: string;
  /** Saken i GSAK/PSAK som journalposten skal knyttes til. */
  arkivsak?: Arkivsak;
  /**
   * Systemet som opprettet dokumentene
   * @example "GOSYS"
   */
  foerstesideOpprettetAv?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
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

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
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

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL:
        axiosConfig.baseURL || "https://foerstesidegenerator.intern.dev.nav.no",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
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
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
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

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
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
 * @title OpenAPI definition
 * @version v0
 * @baseUrl https://foerstesidegenerator.intern.dev.nav.no
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags foersteside-rest-controller
     * @name PostNew
     * @request POST:/api/foerstesidegenerator/v1/foersteside
     */
    postNew: (data: PostFoerstesideRequest, params: RequestParams = {}) =>
      this.request<PostFoerstesideResponse, any>({
        path: `/api/foerstesidegenerator/v1/foersteside`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags foersteside-rest-controller
     * @name GetFoerstesideDataFromLoepenummer
     * @request GET:/api/foerstesidegenerator/v1/foersteside/{loepenummer}
     */
    getFoerstesideDataFromLoepenummer: (
      loepenummer: string,
      params: RequestParams = {},
    ) =>
      this.request<FoerstesideResponse, any>({
        path: `/api/foerstesidegenerator/v1/foersteside/${loepenummer}`,
        method: "GET",
        ...params,
      }),
  };
}
