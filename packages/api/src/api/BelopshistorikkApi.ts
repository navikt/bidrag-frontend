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

/** Request for å hente bidragssaker med perioder for skyldner i angitt periode */
export interface LopendeBidragPeriodeRequest {
  /** Skyldners personident */
  skyldner: string;
  /** Periode som det ønskes å hente stønadsperioder for */
  periode: TypeArManedsperiode;
}

export interface TypeArManedsperiode {
  /**
   * @pattern YYYY-MM
   * @example "2023-01"
   */
  fom: string;
  /**
   * @pattern YYYY-MM
   * @example "2023-01"
   */
  til?: string | null;
}

export interface BidragPeriode {
  /** Periode for bidrag */
  periode: TypeArManedsperiode;
  /** Løpende beløp i stønaden for periode */
  løpendeBeløp: number;
  /** Valutakode */
  valutakode: string;
}

/** Objekt med relevant informasjon om skyldners bidragssaker */
export interface LopendeBidrag {
  /** Saksnummer */
  sak: string;
  /** Hvilken type stønad det er snakk om */
  type: Stonadstype;
  /** Personen som er kravhaver i stønaden */
  kravhaver: string;
  /** Personen som er mottaker i stønaden */
  mottaker?: string | null;
  /** Liste med perioder og beløp */
  periodeListe: BidragPeriode[];
}

/** Respons med alle løpende bidragssaker for angitt skyldner i angitt periode */
export interface LopendeBidragPeriodeResponse {
  /** Liste med skyldners løpende bidragssaker */
  bidragListe: LopendeBidrag[];
}

export enum Stonadstype {
  BIDRAG = "BIDRAG",
  FORSKUDD = "FORSKUDD",
  BIDRAG18AAR = "BIDRAG18AAR",
  EKTEFELLEBIDRAG = "EKTEFELLEBIDRAG",
  MOTREGNING = "MOTREGNING",
  OPPFOSTRINGSBIDRAG = "OPPFOSTRINGSBIDRAG",
}

/** Request for å hente stønad som matcher angitte parametre */
export interface HentStonadRequest {
  /** Stønadstype */
  type: Stonadstype;
  /** Referanse til sak */
  sak: string;
  /** Personidenten til den som skal betale stønaden */
  skyldner: string;
  /** Personidenten til den som krever stønaden */
  kravhaver: string;
}

export enum Innkrevingstype {
  MED_INNKREVING = "MED_INNKREVING",
  UTEN_INNKREVING = "UTEN_INNKREVING",
}

export interface StonadDto {
  /**
   * Stønadsid
   * @format int32
   */
  stønadsid: number;
  /** Stønadstype */
  type: Stonadstype;
  /** Referanse til sak */
  sak: string;
  /** Personidenten til den som skal betale bidraget */
  skyldner: string;
  /** Personidenten til den som krever bidraget */
  kravhaver: string;
  /** Personidenten til den som mottar bidraget */
  mottaker: string;
  /**
   * Angir første år en stønad skal indeksreguleres
   * @deprecated
   * @format int32
   */
  førsteIndeksreguleringsår?: number | null;
  /**
   * Angir neste år siste perioden i stønaden skal indeksreguleres
   * @format int32
   */
  nesteIndeksreguleringsår?: number | null;
  /** Angir om stønaden skal innkreves */
  innkreving: Innkrevingstype;
  /** opprettet_av */
  opprettetAv: string;
  /**
   * opprettet tidspunkt
   * @format date-time
   */
  opprettetTidspunkt: string;
  /** endret av */
  endretAv?: string | null;
  /**
   * når sist endret tidspunkt
   * @format date-time
   */
  endretTidspunkt?: string | null;
  /** Liste over alle perioder som inngår i stønaden */
  periodeListe: StonadPeriodeDto[];
}

export interface StonadPeriodeDto {
  /**
   * Periodeid
   * @format int32
   */
  periodeid: number;
  /** Periode med fra-og-med-dato og til-dato med format ÅÅÅÅ-MM */
  periode: TypeArManedsperiode;
  /**
   * Stønadsid
   * @format int32
   */
  stønadsid: number;
  /**
   * Vedtaksid
   * @format int32
   */
  vedtaksid: number;
  /**
   * Perioden er gyldig fra angitt tidspunkt (vedtakstidspunkt)
   * @format date-time
   */
  gyldigFra: string;
  /**
   * Angir tidspunkt perioden eventuelt er ugyldig fra (tidspunkt for vedtak med periode som erstattet denne)
   * @format date-time
   */
  gyldigTil?: string | null;
  /**
   * Periode-gjort-ugyldig-av-vedtaksid
   * @format int32
   */
  periodeGjortUgyldigAvVedtaksid?: number | null;
  /** Beregnet stønadsbeløp */
  beløp?: number | null;
  /** Valutakoden tilhørende stønadsbeløpet */
  valutakode?: string | null;
  /** Resultatkode for stønaden */
  resultatkode: string;
}

export interface PeriodeBelop {
  /** Periode med fra-og-med-dato og til-dato med format ÅÅÅÅ-MM */
  periode: TypeArManedsperiode;
  /** Beregnet stønadsbeløp */
  beløp?: number | null;
  /** Valutakode for stønadsbeløpet */
  valutakode?: string | null;
}

/** Respons med stønad og beløpsinformasjon for alle perioder */
export interface StonadMedPeriodeBelopResponse {
  /**
   * Angir første år en stønad skal indeksreguleres
   * @deprecated
   * @format int32
   */
  førsteIndeksreguleringsår?: number | null;
  /**
   * Angir neste år siste perioden i stønaden skal indeksreguleres
   * @format int32
   */
  nesteIndeksreguleringsår?: number | null;
  /** Liste med perioder med beløpsinformasjon for stønaden */
  periodeBeløpListe: PeriodeBelop[];
}

/** Request for å hente stønad og perioder som var gyldige på angitt tidspunkt */
export interface HentStonadHistoriskRequest {
  /** Stønadstype */
  type: Stonadstype;
  /** Referanse til sak */
  sak: string;
  /** Personidenten til den som skal betale stønaden */
  skyldner: string;
  /** Personidenten til den som krever stønaden */
  kravhaver: string;
  /**
   * Tidspunkt som det ønskes å hente gyldige perioder for
   * @format date-time
   */
  gyldigTidspunkt: string;
}

/** Request for å hente alle løpende bidragssaker for angitt skyldner på angitt dato */
export interface LopendeBidragssakerRequest {
  /** Personen som er skyldner */
  skyldner: string;
  /**
   * Dato som det ønskes å hente gyldige perioder for
   * @format date
   */
  dato: string;
}

/** Objekt med relevant informasjon om skyldners bidragssaker */
export interface LopendeBidragssak {
  /** Saksnummer */
  sak: string;
  /** Hvilken type stønad det er snakk om */
  type: Stonadstype;
  /** Personen som er kravhaver i stønaden */
  kravhaver: string;
  /** Løpende beløp i stønaden på dato angitt i requesten */
  løpendeBeløp: number;
  /** Valutakoden tilhørende stønadsbeløpet */
  valutakode: string;
}

/** Respons med alle løpende bidragssaker for angitt skyldner på angitt dato */
export interface LopendeBidragssakerResponse {
  /** Liste med info om skyldnerens løpende bidragssaker */
  bidragssakerListe: LopendeBidragssak[];
}

/** Request for å hente alle stønader for angitt skyldner */
export interface SkyldnerStonaderRequest {
  /** Personen som er skyldner */
  skyldner: string;
}

/** Objekt med relevant informasjon om skyldners stønader */
export interface SkyldnerStonad {
  /** Saksnummer */
  sak: string;
  /** Hvilken type stønad det er snakk om */
  type: Stonadstype;
  /** Personen som er kravhaver i stønaden */
  kravhaver: string;
}

/** Respons med alle stønader for angitt skyldner */
export interface SkyldnerStonaderResponse {
  /** Liste med info om skyldnerens stønader */
  stønader: SkyldnerStonad[];
}

export interface EngangsbelopDto {
  /**
   * Engangsbeløpsid
   * @format int32
   */
  engangsbeløpsid: number;
  /** Engangsbeløptype */
  type: Engangsbeloptype;
  /** Referanse til sak */
  sak: string;
  /** Personidenten til den som skal betale engangsbeløpet */
  skyldner: string;
  /** Personidenten til den som krever engangsbeløpet */
  kravhaver: string;
  /** Personidenten til den som mottar engangsbeløpet */
  mottaker: string;
  /**
   * Vedtaksid
   * @format int32
   */
  vedtaksid: number;
  /**
   * Perioden er gyldig fra angitt tidspunkt (vedtakstidspunkt)
   * @format date-time
   */
  gyldigFra: string;
  /**
   * Angir tidspunkt perioden eventuelt er ugyldig fra (tidspunkt for vedtak med periode som erstattet denne)
   * @format date-time
   */
  gyldigTil?: string | null;
  /**
   * Periode-gjort-ugyldig-av-vedtaksid
   * @format int32
   */
  gjortUgyldigAvVedtaksid?: number | null;
  /**
   * Beregnet engangsbeløp
   * @min 0
   */
  beløp?: number | null;
  /**
   * Beløp BP allerede har betalt
   * @min 0
   */
  betaltBeløp?: number | null;
  /**
   * Valutakoden tilhørende engangsbeløpet
   * @minLength 1
   */
  valutakode: string | null;
  /**
   * Resultatkoden tilhørende engangsbeløpet
   * @minLength 1
   */
  resultatkode: string;
  /** Angir om engangsbeløpet skal innkreves */
  innkreving: Innkrevingstype;
  /** Referanse til engangsbeløp, brukes for å kunne omgjøre engangsbeløp senere i et klagevedtak. Unik innenfor et vedtak.Referansen er enten angitt i requesten for opprettelse av vedtak eller generert av bidrag-vedtak hvis den ikke var angitt i requesten. */
  referanse: string;
  opprettetAv: string;
  /** @format date-time */
  opprettetTidspunkt: string;
  endretAv?: string | null;
  /** @format date-time */
  endretTidspunkt?: string | null;
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
      baseURL: axiosConfig.baseURL || "https://bidrag-belopshistorikk-q2.intern.dev.nav.no",
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
 * @title bidrag-beløpshistorikk
 * @version v1
 * @baseUrl https://bidrag-belopshistorikk-q2.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  hentStonaderIPeriode = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentAlleLopendeStonaderIPeriode
     * @summary Finn alle løpende stønader i mottatt periode tilknyttet skyldner angitt i request
     * @request POST:/hent-stonader-i-periode/
     * @secure
     */
    hentAlleLopendeStonaderIPeriode: (data: LopendeBidragPeriodeRequest, params: RequestParams = {}) =>
      this.request<LopendeBidragPeriodeResponse, any>({
        path: `/hent-stonader-i-periode/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  hentStonad = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentStonad
     * @summary Finn alle data for en stønad
     * @request POST:/hent-stonad/
     * @secure
     */
    hentStonad: (data: HentStonadRequest, params: RequestParams = {}) =>
      this.request<StonadDto, void>({
        path: `/hent-stonad/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  hentStonadPeriodebelop = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentStonadMedPeriodebelop
     * @summary Finn alle data for en stønad med historikk for perioder
     * @request POST:/hent-stonad-periodebeløp/
     * @secure
     */
    hentStonadMedPeriodebelop: (data: HentStonadRequest, params: RequestParams = {}) =>
      this.request<StonadMedPeriodeBelopResponse, void>({
        path: `/hent-stonad-periodebeløp/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  hentStonadHistorisk = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentStonadHistorisk
     * @summary Finn alle data for en stønad for angitt tidspunkt
     * @request POST:/hent-stonad-historisk/
     * @secure
     */
    hentStonadHistorisk: (data: HentStonadHistoriskRequest, params: RequestParams = {}) =>
      this.request<StonadDto, void>({
        path: `/hent-stonad-historisk/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  hentLopendeBidragssakerForSkyldner = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentLopendeBidragssakerForSkyldner
     * @summary Finn alle løpende bidragssaker der angitt personident er skyldner.Gjelder barnebidrag, oppfostringssbidrag og 18-årsbidrag
     * @request POST:/hent-lopende-bidragssaker-for-skyldner
     * @secure
     */
    hentLopendeBidragssakerForSkyldner: (data: LopendeBidragssakerRequest, params: RequestParams = {}) =>
      this.request<LopendeBidragssakerResponse, void>({
        path: `/hent-lopende-bidragssaker-for-skyldner`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  hentAlleStonaderForSkyldner = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentAlleStonaderForSkyldner
     * @summary Finn alle stønader der angitt personident er skyldner.
     * @request POST:/hent-alle-stonader-for-skyldner
     * @secure
     */
    hentAlleStonaderForSkyldner: (data: SkyldnerStonaderRequest, params: RequestParams = {}) =>
      this.request<SkyldnerStonaderResponse, any>({
        path: `/hent-alle-stonader-for-skyldner`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  hentStonaderForSak = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentStonaderForSak
     * @summary Finner alle stønader innenfor angitt sak
     * @request GET:/hent-stonader-for-sak/{sak}
     * @secure
     */
    hentStonaderForSak: (sak: string, params: RequestParams = {}) =>
      this.request<StonadDto[], void>({
        path: `/hent-stonader-for-sak/${sak}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  engangsbelop = {
    /**
     * No description
     *
     * @tags bel-øpshistorikk-controller
     * @name HentEngangsbelopForSak
     * @summary Finner alle engangsbeløp innenfor angitt sak
     * @request GET:/engangsbelop/{sak}
     * @secure
     */
    hentEngangsbelopForSak: (sak: string, params: RequestParams = {}) =>
      this.request<EngangsbelopDto[], any>({
        path: `/engangsbelop/${sak}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}
