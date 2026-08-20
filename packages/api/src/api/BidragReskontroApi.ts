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
  ident: string;
}

export interface Datoperiode {
  /** @format date */
  fom: string;
  /** @format date */
  til?: string | null;
}

/** Transaksjon på bidragssak. */
export interface Transaksjon {
  /**
   * Id på transaksjonen.
   * @format int64
   */
  transaksjonsid?: number | null;
  /**
   * Transaksjonskoden for transaksjonen.
   * Gyldige transaksjonskoder er:
   * | Kode  | Korreksjonskode | Beskrivelse                                |
   * |-------|-----------------|--------------------------------------------|
   * | A1    | A3              | Bidragsforskudd                            |
   * | A10   |                 | Midlertidig forskuddsats                   |
   * | A2    |                 | Forskudd korrigering                       |
   * | A4    |                 | Forskudd utbetaling                        |
   * | A5    |                 | Forskudd feilutbetaling                    |
   * | A6    |                 | Forskudd erstatningsutbetaling             |
   * | A7    |                 | Forskudd returføring utbetalin             |
   * | B1    | B3              | Underholdsbidrag (m/u tilleggsbidrag)      |
   * | B10   |                 | Privat bidrag utbetaling                   |
   * | B2    |                 | Privat bidrag korrigering                  |
   * | B4    |                 | Privat oppgjør bidrag privat               |
   * | C1    |                 | Offentlig bidrag                           |
   * | C2    |                 | Offentlig bidrag korrigering               |
   * | C4    |                 | Off bidrag BP tilbakebetalt forskudd       |
   * | C5    |                 | Off bidrag tilbakeført innkrevingssak      |
   * | D1    | D3              | 18årsbidrag                                |
   * | D10   |                 | Bidrag privat 18 år utbetaling             |
   * | D2    |                 | Bidrag privat 18 år korrigering            |
   * | D4    |                 | Privat oppgjør bidrag 18 år                |
   * | E1    | E3              | Bidrag til særlige utgifter (særtilskudd)  |
   * | E10   |                 | Særtilskudd utbetaling                     |
   * | E2    |                 | Særtilskudd korrigering                    |
   * | E4    |                 | Privat oppgjør særtilskudd                 |
   * | F1    | F3              | Ektefellebidrag                            |
   * | F10   |                 | Utbetaling ektefellebidrag                 |
   * | F2    |                 | Ektefellebidrag korrigering                |
   * | F4    |                 | Privat oppgjør ektefellebidrag             |
   * | G1    | G3              | Gebyr                                      |
   * | G2    |                 | Fastsettelsesgebyr korrigering             |
   * | G4    |                 | Fastsettelsesgebyr tilbakebetaling         |
   * | G5    |                 | Fastsettelsesgebyr tilb.ført innkr.sak     |
   * | H1    | H3              | Tilbakekrevd forskudd                      |
   * | H2    |                 | Tilbakekrevd forskudd korrigering          |
   * | H5    |                 | Tilbakekrevd forskudd tilb.ført innkr      |
   * | I1    |                 | Motregning                                 |
   * | I2    |                 | Motregning korrigering                     |
   * | J1    |                 | Kommunale forskuddskrav                    |
   * | J10   |                 | Gamle kommunale krav utbetaling            |
   * | J2    |                 | Kommunale stønadskrav                      |
   * | J3    |                 | Folketrygdens stønadskrav                  |
   * | K1    |                 | Ettergivelse                               |
   * | K10   |                 | Ettergivelse korrigering                   |
   * | K2    |                 | Direkte oppgjør (innbetalt beløp)          |
   * | K3    |                 | Tilbakekreving ettergivelse                |
   * | 301   |                 | OCR innbetaling                            |
   * | 302   |                 | Trygdetrekk                                |
   * | 303   |                 | Trekk i utbetaling                         |
   * | 304   |                 | Aetat innbetaling                          |
   * | 305   |                 | Innbetaling Adra                           |
   * | 307   |                 | Tilbakeført fra reskontro                  |
   * | 309   |                 | Manuelt ført innbetaling                   |
   * | 371   |                 | Tilbakebetaling                            |
   * | 390   |                 | Annullert innbet                           |
   * | 400   |                 | Avskrivning                                |
   * | 401   |                 | Innbetaling/avskriving                     |
   */
  transaksjonskode?: string | null;
  /** Beskrivelse av transaksjonen. */
  beskrivelse?: string | null;
  /**
   * Dato uvist over hva
   * @format date
   */
  dato?: string | null;
  /** Ident til skyldner. */
  skyldner?: string | null;
  /** Ident til mottaker. */
  mottaker?: string | null;
  /** Opprinnelig beløp på transaksjonen. */
  beløp?: number | null;
  /** Resterende beløp. */
  restBeløp?: number | null;
  /** Beløp i opprinnelig valuta. */
  beløpIOpprinneligValuta?: number | null;
  /** Valutakode slik utlevert fra NAV. */
  valutakode?: string | null;
  /** Saksnummer for bidragssaken. */
  saksnummer?: string | null;
  periode?: Datoperiode | null;
  /** Ident til barn. */
  barn?: string | null;
  /** Delytelsesid for transaksjonen. */
  delytelsesid?: string | null;
  /** Søknadstype. Tom for A6, A7, B10, D10, E10, F10, G2, H2, I2, J10, K1, 301, 302, 303, 304, 305, 306, 307, 308, 309, 371, 372, 373, 374, 375, 376, 377, 378, 378, 379, 400. */
  søknadstype?: string | null;
}

export interface Transaksjoner {
  /** Liste over alle transaksjoenen på bidragssak */
  transaksjoner: Transaksjon[];
}

export interface SaksnummerRequest {
  /** Saksnummer, refereres til hos skatt som bidragssaksnummer. */
  saksnummer: string;
}

/** Inneholder informasjon om bidragssaken fra skatt */
export interface Bidragssak {
  /** Identifikasjonen til bidragssaken. */
  saksnummer?: string | null;
  /** Resterende gjeld til BM på fastsettelsesgebyret (G1). */
  bmGjeldFastsettelsesgebyr?: number | null;
  /** Resterende gjeld til BM. Gjelder for H1 - Tilbakekreving. */
  bmGjeldRest?: number | null;
  /** Resterende gjeld til BP på fastsettelsesgebyret (G1). */
  bpGjeldFastsettelsesgebyr?: number | null;
  /** Liste over alle barn i bidragssaken med tilhørende innkrevingsinformasjon. */
  barn: SaksinformasjonBarn[];
}

/** Inneholder informasjon om bidragssaken fra skatt med skyldner */
export interface BidragssakMedSkyldner {
  skyldner?: Skyldner | null;
  bidragssaker?: any[] | null;
}

/** Liste over alle barn i bidragssaken med tilhørende innkrevingsinformasjon. */
export interface SaksinformasjonBarn {
  /** Ident til barnet. */
  personident?: string | null;
  /** Resterende gjeld til det offentlige (C1, C2, C3). */
  restGjeldOffentlig?: number | null;
  /** Resterende gjeld privat (B1, D1, E1, F1, J1, J2). */
  restGjeldPrivat?: number | null;
  /** Sum av beløp som ikke er utbetalt tilbake til bidragspliktig. Dette kan skje ved for mye innbetalt eller annullerte beløp. Beregnes ikke for kall på personIdent. */
  sumIkkeUtbetalt?: number | null;
  /** Sum av restbeløp på forskudd (A1). */
  sumForskuddUtbetalt?: number | null;
  /** Sum av restbeløp på forskudd (A1). Beregnes ikke for kall på saksnummer. */
  restGjeldPrivatAndel?: number | null;
  /** Sum av restbeløp på forskudd (A1). Beregnes ikke for kall på saksnummer. */
  sumUtbetaltAndel?: number | null;
  /** Sum av restbeløp på forskudd (A1). Beregnes ikke for kall på saksnummer. */
  sumForskuddUtbetaltAndel?: number | null;
  periode?: Datoperiode | null;
  /** Angir om det er stopp i utbetaling. Beregnes ikke for kall på personIdent. */
  erStoppIUtbetaling?: boolean | null;
}

/** Informasjon om skyldner. */
export interface Skyldner {
  /** Identen til skyldner */
  personident?: string | null;
  /** Sum av beløpsfelt fra innbetalinger i historikk avhengig av fordelingsstatus. */
  innbetaltBeløpUfordelt?: number | null;
  /** Sum av saldo gebyrer på sak. */
  gjeldIlagtGebyr?: number | null;
}

/** Inneholder informasjon om gjeldende betalingsordning. */
export interface GjeldendeBetalingsordning {
  /** Hvilken type behandlingsordning er. E.g "Lønnstrekk" */
  typeBehandlingsordning?: string | null;
  /** Hvor innbetalingen kommer fra. Orgnr for bedrift. */
  kilde?: string | null;
  /** Navn på bedrift. */
  kildeNavn?: string | null;
  /**
   * Dato for siste giro.
   * @format date-time
   */
  datoSisteGiro?: string | null;
  /**
   * Dato for neste forfall.
   * @format date-time
   */
  nesteForfall?: string | null;
  /** Månedlig beløp. */
  beløp?: number | null;
  /**
   * Sist endret tidspunkt.
   * @format date-time
   */
  sistEndret?: string | null;
  /** Årsak for endring. */
  sistEndretÅrsak?: string | null;
  /** Sum av ubetalt gjeld. */
  sumUbetalt?: number | null;
}

/** Inneholder informasjon om historikken til innkrevingssaken. */
export interface Innkrevingssakshistorikk {
  /** Beskrivelse av hva posten innebar. E.g "OCR Innbetaling" eller "Påløp avdragsordning". */
  beskrivelse?: string | null;
  /** Ident knyttet til det historiske innslaget. */
  ident?: string | null;
  /** Navn til ident knyttet til det historiske innslaget. */
  navn?: string | null;
  /**
   * Tidspunkt for innslaget.
   * @format date-time
   */
  dato?: string | null;
  /** Innbetalt beløp. */
  beløp?: number | null;
}

/** Inneholder informasjon om innkrevingssaken. */
export interface Innkrevingssaksinformasjon {
  skyldnerinformasjon?: Skyldnerinformasjon | null;
  gjeldendeBetalingsordning?: GjeldendeBetalingsordning | null;
  nyBetalingsordning?: NyBetalingsordning | null;
  innkrevingssakshistorikk?: any[] | null;
}

/** Inneholder informasjon om ny betalingsordning. */
export interface NyBetalingsordning {
  dato?: Datoperiode | null;
  /** Nytt beløp. */
  beløp?: number | null;
}

/** Inneholder informasjon om skyldneren i innkrevingssaken. */
export interface Skyldnerinformasjon {
  /** Identen til skyldner */
  personident?: string | null;
  /** Summen av det løpende bidraget på skyldner.  */
  sumLøpendeBidrag?: number | null;
  /** Gjeldene status på innkrevingssaken.  */
  innkrevingssaksstatus?: string | null;
  /**
   * Fakturamåte.
   * Gyldige verdier er følgende:
   * Vanlig giro
   * Avtalegiro m/orientering
   * Avtalegiro u/orientering
   * Ingen med purring/arbeidsflyt
   * Ingen uten purring/arbeidsflyt
   */
  fakturamåte?: string | null;
  /** Siste aktivitet som har oppdatert status på saken. */
  sisteAktivitet?: string | null;
}

export interface EndreRmForSakRequest {
  saksnummer: string;
  barn: string;
  nyttFødselsnummer: string;
}

/** Informasjon om en transaksjonskode. */
export interface TransaksjonskodeDto {
  /**
   * Transaksjonskoden.
   * @example "A1"
   */
  kode: string;
  /**
   * Korreksjonskode for transaksjonskoden, hvis det finnes.
   * @example "A3"
   */
  korreksjonskode?: string | null;
  /**
   * Beskrivelse av transaksjonskoden.
   * @example "Bidragsforskudd"
   */
  beskrivelse: string;
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
      baseURL: axiosConfig.baseURL || "https://bidrag-reskontro-q2.intern.dev.nav.no",
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
 * @title bidrag-reskontro
 * @version v1
 * @baseUrl https://bidrag-reskontro-q2.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  transaksjoner = {
    /**
     * @description Henter alle transaksjoner fra ELIN som er knyttet til en persons fødselsnummer eller D-nummer. Transaksjonene inkluderer beløp, transaksjonskode, periode og involvert skyldner/mottaker.
     *
     * @tags Reskontro
     * @name HentTransaksjonerPaPerson
     * @summary Hent transaksjoner på person
     * @request POST:/transaksjoner/person
     * @secure
     */
    hentTransaksjonerPaPerson: (data: PersonRequest, params: RequestParams = {}) =>
      this.request<Transaksjoner, void>({
        path: `/transaksjoner/person`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Henter alle transaksjoner fra ELIN som er registrert på en bidragssak identifisert med saksnummer. Transaksjonene inkluderer beløp, transaksjonskode, periode og involvert skyldner/mottaker.
     *
     * @tags Reskontro
     * @name HentTransaksjonerPaBidragssak
     * @summary Hent transaksjoner på bidragssak
     * @request POST:/transaksjoner/bidragssak
     * @secure
     */
    hentTransaksjonerPaBidragssak: (data: SaksnummerRequest, params: RequestParams = {}) =>
      this.request<Transaksjoner, void>({
        path: `/transaksjoner/bidragssak`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Henter én eller flere transaksjoner fra ELIN basert på en unik transaksjons-ID. Brukes typisk for å slå opp detaljer om en kjent transaksjon.
     *
     * @tags Reskontro
     * @name HentTransaksjonerPaTransaksjonsid
     * @summary Hent transaksjoner på transaksjons-ID
     * @request GET:/transaksjoner/transaksjonsid
     * @secure
     */
    hentTransaksjonerPaTransaksjonsid: (
      query: {
        /**
         * Unik numerisk ID for transaksjonen som skal slås opp.
         * @format int64
         * @example 123456789
         */
        transaksjonsid: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Transaksjoner, void>({
        path: `/transaksjoner/transaksjonsid`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  innkrevningssak = {
    /**
     * @description Henter alle innkrevingssaker fra ELIN som er knyttet til en persons fødselsnummer eller D-nummer. Returnerer skyldnerinformasjon samt gjeldsinformasjon per bidragssak og per barn i saken.
     *
     * @tags Reskontro
     * @name HentInnkrevingssakPaPerson
     * @summary Hent innkrevingssaker på person
     * @request POST:/innkrevningssak/person
     * @secure
     */
    hentInnkrevingssakPaPerson: (data: PersonRequest, params: RequestParams = {}) =>
      this.request<BidragssakMedSkyldner, void>({
        path: `/innkrevningssak/person`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Henter innkrevingssaksinformasjon fra ELIN for én enkelt bidragssak identifisert med saksnummer. Returnerer gjeldsinformasjon per barn i saken, inkludert rest gjeld offentlig og privat.
     *
     * @tags Reskontro
     * @name HentInnkrevingssakPaBidragssak
     * @summary Hent innkrevingssak på bidragssak
     * @request POST:/innkrevningssak/bidragssak
     * @secure
     */
    hentInnkrevingssakPaBidragssak: (data: SaksnummerRequest, params: RequestParams = {}) =>
      this.request<Bidragssak, void>({
        path: `/innkrevningssak/bidragssak`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  innkrevingsinformasjon = {
    /**
     * @description Henter detaljert informasjon om innkrevingssaken knyttet til en persons fødselsnummer eller D-nummer. Inkluderer skyldnerinformasjon, gjeldende betalingsordning, eventuell ny betalingsordning og sakshistorikk.
     *
     * @tags Reskontro
     * @name HentInformasjonOmInnkrevingssaken
     * @summary Hent innkrevingssaksinformasjon på person
     * @request POST:/innkrevingsinformasjon
     * @secure
     */
    hentInformasjonOmInnkrevingssaken: (data: PersonRequest, params: RequestParams = {}) =>
      this.request<Innkrevingssaksinformasjon, void>({
        path: `/innkrevingsinformasjon`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  endreRmForSak = {
    /**
     * @description Oppdaterer regnskapsmottaker (RM) for et barn i en bidragssak i ELIN. Brukes når et barns fødselsnummer skal byttes ut, f.eks. ved tildeling av nytt D-nummer.
     *
     * @tags Reskontro
     * @name EndreRmForSak
     * @summary Endre regnskapsmottaker (RM) for sak
     * @request PATCH:/endreRmForSak
     * @secure
     */
    endreRmForSak: (data: EndreRmForSakRequest, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/endreRmForSak`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  transaksjonskoder = {
    /**
     * @description Returnerer en komplett liste over alle gyldige transaksjonskoder med tilhørende beskrivelse. Kan brukes som oppslagsverk for å tolke transaksjonskoder i andre responser.
     *
     * @tags Reskontro
     * @name HentTransaksjonskoder
     * @summary Hent alle gyldige transaksjonskoder
     * @request GET:/transaksjonskoder
     * @secure
     */
    hentTransaksjonskoder: (params: RequestParams = {}) =>
      this.request<TransaksjonskodeDto[], void>({
        path: `/transaksjonskoder`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
