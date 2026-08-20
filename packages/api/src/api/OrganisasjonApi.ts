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

export enum Arbeidsfordeling {
  BBF = "BBF",
  EEN = "EEN",
  EFS = "EFS",
  FRS = "FRS",
  INH = "INH",
  OPS = "OPS",
  RKS = "RKS",
}

export enum Behandlingstype {
  FORVALTNING = "FORVALTNING",
  KLAGE = "KLAGE",
  SOKNAD = "SØKNAD",
}

export interface HentEnhetRequest {
  ident: string;
  /** @uniqueItems true */
  biidenter: string[];
  tema: string;
  /**
   * Bruk heller arbeidsfordeling
   * @deprecated
   */
  behandlingstema?: string | null;
  arbeidsfordeling?: Arbeidsfordeling | null;
  sakskategori?: "U" | "N";
  behandlingstype?: Behandlingstype | null;
}

export interface EnhetDto {
  nummer: string;
  navn?: string | null;
  /**
   * bruk nummer
   * @deprecated
   */
  enhetIdent: string;
  /**
   * bruk navn
   * @deprecated
   */
  enhetNavn?: string | null;
  status: "AKTIV" | "NEDLAGT";
}

export interface SaksbehandlerDto {
  ident: string;
  /** Saksbehandlers navn (med eventuelt fornavn bak komma) */
  navn?: string | null;
}

export interface BidragEnheterResponsDto {
  grupper: EnheterGruppeDto[];
}

export interface EnhetDetaljerDto {
  enhetId: string;
  navn?: string | null;
  sakskategori: "U" | "N";
  settekontorEnhetId?: string | null;
  telefonnummer?: string | null;
  postadresse: Record<string, EnhetPostadresseDto>;
}

export interface EnhetPostadresseDto {
  navn?: string | null;
  postnummer?: string | null;
  adresselinje1?: string | null;
  adresselinje2?: string | null;
  poststed?: string | null;
  land?: string | null;
  kommunenr?: string | null;
}

export interface EnheterGruppeDto {
  gruppeNavn: string;
  enheter: EnhetDetaljerDto[];
}

export interface EnhetKontaktinfoDto {
  nummer: string;
  navn?: string | null;
  /**
   * bruk nummer
   * @deprecated
   */
  enhetIdent: string;
  /**
   * bruk navn
   * @deprecated
   */
  enhetNavn?: string | null;
  telefonnummer?: string | null;
  postadresse?: EnhetPostadresseDto | null;
}

export interface EnhetBrukerDto {
  navIdent: string;
  navn: string;
}

export interface JournalforendeEnhetDto {
  nummer?: string | null;
  navn?: string | null;
  type?: string | null;
  /**
   * bruk nummer
   * @deprecated
   */
  enhetIdent?: string | null;
  /**
   * bruk navn
   * @deprecated
   */
  enhetNavn?: string | null;
  /**
   * bruk type
   * @deprecated
   */
  enhetType?: string | null;
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
      baseURL: axiosConfig.baseURL || "https://bidrag-organisasjon-feature.intern.dev.nav.no/bidrag-organisasjon",
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
 * @title bidrag-organisasjon
 * @version v1
 * @baseUrl https://bidrag-organisasjon-feature.intern.dev.nav.no/bidrag-organisasjon
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  arbeidsfordeling = {
    /**
     * @description Hent enheter fra arbeidsfordeling basert på geografisk tilknytning for en person
     *
     * @tags organisasjon-controller
     * @name HentArbeidsfordelingGeografiskTilknytningEnhet
     * @request POST:/arbeidsfordeling/enhet/geografisktilknytning
     * @secure
     */
    hentArbeidsfordelingGeografiskTilknytningEnhet: (data: HentEnhetRequest, params: RequestParams = {}) =>
      this.request<EnhetDto, any>({
        path: `/arbeidsfordeling/enhet/geografisktilknytning`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Hent journalførende enheter fra arbeidsfordeling
     *
     * @tags organisasjon-controller
     * @name HentArbeidsfordelingJournalforendeEnheter
     * @request GET:/arbeidsfordeling/enhetsliste/journalforende
     * @secure
     */
    hentArbeidsfordelingJournalforendeEnheter: (params: RequestParams = {}) =>
      this.request<JournalforendeEnhetDto[], void>({
        path: `/arbeidsfordeling/enhetsliste/journalforende`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent enheter fra arbeidsfordeling basert på geografisk tilknytning for en person
     *
     * @tags organisasjon-controller
     * @name HentArbeidsfordelingGeografiskTilknytningEnheter
     * @request GET:/arbeidsfordeling/enhetsliste/geografisktilknytning/{ident}
     * @deprecated
     * @secure
     */
    hentArbeidsfordelingGeografiskTilknytningEnheter: (
      ident: string,
      query?: {
        tema?: string;
        behandlingstema?: string;
        arbeidsfordeling?: Arbeidsfordeling;
      },
      params: RequestParams = {},
    ) =>
      this.request<EnhetDto, any>({
        path: `/arbeidsfordeling/enhetsliste/geografisktilknytning/${ident}`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),
  };
  saksbehandler = {
    /**
     * @description Hent informasjon om saksbehandler
     *
     * @tags organisasjon-controller
     * @name HentSaksbehandlerInfo
     * @request GET:/saksbehandler/info/{saksbehandlerIdent}
     * @secure
     */
    hentSaksbehandlerInfo: (saksbehandlerIdent: string, params: RequestParams = {}) =>
      this.request<SaksbehandlerDto, void>({
        path: `/saksbehandler/info/${saksbehandlerIdent}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent enheter for saksbehandler
     *
     * @tags organisasjon-controller
     * @name HentSaksbehandlerEnheter
     * @request GET:/saksbehandler/enhetsliste/{saksbehandlerIdent}
     * @secure
     */
    hentSaksbehandlerEnheter: (saksbehandlerIdent: string, params: RequestParams = {}) =>
      this.request<EnhetDto[], void>({
        path: `/saksbehandler/enhetsliste/${saksbehandlerIdent}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  enheter = {
    /**
     * @description Hent grupper av enheter fra konfigurasjon
     *
     * @tags organisasjon-controller
     * @name HentEnheterGrupper
     * @request GET:/enheter/grupper
     * @secure
     */
    hentEnheterGrupper: (params: RequestParams = {}) =>
      this.request<BidragEnheterResponsDto, any>({
        path: `/enheter/grupper`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  enhet = {
    /**
     * @description Hent kontaktinformasjon til enhet
     *
     * @tags organisasjon-controller
     * @name HentEnhetKontaktinfo
     * @request GET:/enhet/kontaktinfo/{enhetNr}
     * @secure
     */
    hentEnhetKontaktinfo: (enhetNr: string, params: RequestParams = {}) =>
      this.request<EnhetKontaktinfoDto, void>({
        path: `/enhet/kontaktinfo/${enhetNr}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent kontaktinformasjon til enhet
     *
     * @tags organisasjon-controller
     * @name HentEnhetKontaktinfo1
     * @request GET:/enhet/kontaktinfo/{enhetNr}/{spraak}
     * @secure
     */
    hentEnhetKontaktinfo1: (enhetNr: string, spraak: string, params: RequestParams = {}) =>
      this.request<EnhetKontaktinfoDto, void>({
        path: `/enhet/kontaktinfo/${enhetNr}/${spraak}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Hent informasjon om enhet
     *
     * @tags organisasjon-controller
     * @name HentEnhetInfo
     * @request GET:/enhet/info/{enhetNr}
     * @secure
     */
    hentEnhetInfo: (enhetNr: string, params: RequestParams = {}) =>
      this.request<EnhetDto, void>({
        path: `/enhet/info/${enhetNr}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  brukere = {
    /**
     * @description Hent brukere for bidrag-enhet
     *
     * @tags organisasjon-controller
     * @name HentBidragEnhetBrukere
     * @request GET:/brukere/enhet/{enhetsnummer}
     * @secure
     */
    hentBidragEnhetBrukere: (enhetsnummer: string, params: RequestParams = {}) =>
      this.request<EnhetBrukerDto[], any>({
        path: `/brukere/enhet/${enhetsnummer}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}
