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
    navIdent?: string;
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

export interface SjekkTilgangSakRequestDto {
    saksnummer: string;
}

export interface SjekkTilgangPersonISakRequest {
    personident: string;
    saksnummer: string;
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
    id?: string;
    onPremisesSamAccountName?: string;
}

export interface BrukerinformasjonResponse {
    "@odata.nextLink"?: string;
    value?: Brukerinformasjon[];
}

export interface BrukerGrupperResponse {
    value?: Gruppe[];
}

export interface Gruppe {
    id?: string;
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
        securityData: SecurityDataType | null
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
         * @description Sjekker om bruker har tilgang til fagtema
         *
         * @tags tilgang-controller-v-2
         * @name SjekkTilgangTema
         * @request POST:/v2/api/tilgang/tema
         * @secure
         */
        sjekkTilgangTema: (data: TilgangTilTemaRequest, params: RequestParams = {}) =>
            this.request<TilgangskontrollResponse, any>({
                path: `/v2/api/tilgang/tema`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til søknadsgrupper
         *
         * @tags tilgang-controller-v-2
         * @name SjekkTilgangSoknadsgrupper
         * @request POST:/v2/api/tilgang/soknadsgrupper
         * @secure
         */
        sjekkTilgangSoknadsgrupper: (
            query: {
                søknadsgruppe: "BARNEBORTFØRING" | "EKTEFELLEBIDRAG" | "OPPFOSTRINGSBIDRAG" | "REISEUTGIFTER";
                navident?: string;
            },
            params: RequestParams = {}
        ) =>
            this.request<TilgangskontrollResponse, any>({
                path: `/v2/api/tilgang/soknadsgrupper`,
                method: "POST",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekk tilgang sak
         *
         * @tags tilgang-controller-v-2
         * @name SjekkTilgangSakV2
         * @request POST:/v2/api/tilgang/sak
         * @secure
         */
        sjekkTilgangSakV2: (data: TilgangTilSakRequest, params: RequestParams = {}) =>
            this.request<TilgangskontrollResponse, any>({
                path: `/v2/api/tilgang/sak`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til person
         *
         * @tags tilgang-controller-v-2
         * @name SjekkTilgangPerson
         * @request POST:/v2/api/tilgang/person
         * @secure
         */
        sjekkTilgangPerson: (data: TilgangTilPersonRequest, params: RequestParams = {}) =>
            this.request<TilgangskontrollResponse, any>({
                path: `/v2/api/tilgang/person`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til å opprette sak uten BM og bare med BP og barn
         *
         * @tags tilgang-controller-v-2
         * @name SjekkTilgangOpprettSakUtenBm
         * @request POST:/v2/api/tilgang/opprettsakutenbm
         * @secure
         */
        sjekkTilgangOpprettSakUtenBm: (params: RequestParams = {}) =>
            this.request<TilgangskontrollResponse, any>({
                path: `/v2/api/tilgang/opprettsakutenbm`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Henter brukertilganger for bruker basert på token.
         *
         * @tags tilgang-controller-v-2
         * @name HentBrukertilganger
         * @request POST:/v2/api/tilgang/brukertilganger
         * @secure
         */
        hentBrukertilganger: (params: RequestParams = {}) =>
            this.request<Brukertilganger, any>({
                path: `/v2/api/tilgang/brukertilganger`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekk tilgang sak
         *
         * @tags sporingsdata-controller-v-2
         * @name HentSakSporingsdata
         * @request POST:/v2/api/sporingsdata/sak
         * @secure
         */
        hentSakSporingsdata: (data: SporingsdataSakRequest, params: RequestParams = {}) =>
            this.request<Sporingsdata, any>({
                path: `/v2/api/sporingsdata/sak`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til person
         *
         * @tags sporingsdata-controller-v-2
         * @name HentPersonSporingsdata
         * @request POST:/v2/api/sporingsdata/person
         * @secure
         */
        hentPersonSporingsdata: (data: SporingsdataPersonRequest, params: RequestParams = {}) =>
            this.request<Sporingsdata, any>({
                path: `/v2/api/sporingsdata/person`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Henter alle enheter som brukeren tilhører.
         *
         * @tags tilgang-controller-v-2
         * @name HentEnheterForBruker
         * @request GET:/v2/api/tilgang/enheter
         * @secure
         */
        hentEnheterForBruker: (
            query?: {
                navident?: string;
            },
            params: RequestParams = {}
        ) =>
            this.request<BrukerEnheterRespons, any>({
                path: `/v2/api/tilgang/enheter`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Henter alle grupper som brukeren er medlem i.
         *
         * @tags tilgang-controller-v-2
         * @name HentBrukereForEnhet
         * @request GET:/v2/api/tilgang/enhet
         * @secure
         */
        hentBrukereForEnhet: (
            query: {
                enhet: string;
            },
            params: RequestParams = {}
        ) =>
            this.request<BrukerinformasjonResponse, any>({
                path: `/v2/api/tilgang/enhet`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Tømmer cache
         *
         * @tags tilgang-controller-v-2
         * @name TomCache
         * @request GET:/v2/api/tilgang/cache/clear
         * @secure
         */
        tomCache: (
            query: {
                cacheType:
                    | "PIP_PDL"
                    | "PIP_SAK"
                    | "ABAC"
                    | "PIP_SKJERMING"
                    | "TILGANGSMASKIN_KJERNEREGLER"
                    | "TILGANGSMASKIN_KJERNEREGLER_BULK"
                    | "TILGANGSMASKIN_KOMPLETTEREGLER"
                    | "TILGANGSMASKIN_KOMPLETTEREGLER_BULK"
                    | "TEMA"
                    | "BRUKERGRUPPER";
            },
            params: RequestParams = {}
        ) =>
            this.request<object, any>({
                path: `/v2/api/tilgang/cache/clear`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Henter brukerinformasjon på navident
         *
         * @tags tilgang-controller-v-2
         * @name HentBrukerinformasjon
         * @request GET:/v2/api/tilgang/brukerinformasjon
         * @secure
         */
        hentBrukerinformasjon: (
            query: {
                navident: string;
            },
            params: RequestParams = {}
        ) =>
            this.request<BrukerinformasjonResponse, any>({
                path: `/v2/api/tilgang/brukerinformasjon`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Henter alle grupper som brukeren er medlem i.
         *
         * @tags tilgang-controller-v-2
         * @name HentBrukergrupper
         * @request GET:/v2/api/tilgang/brukergrupper
         * @secure
         */
        hentBrukergrupper: (
            query: {
                navident: string;
            },
            params: RequestParams = {}
        ) =>
            this.request<BrukerGrupperResponse, any>({
                path: `/v2/api/tilgang/brukergrupper`,
                method: "GET",
                query: query,
                secure: true,
                format: "json",
                ...params,
            }),
    };
    api = {
        /**
         * @description Sjekk tilgang sak
         *
         * @tags tilgangskontroller
         * @name SjekkTilgangSakV21
         * @request POST:/api/tilgang/v2/sak
         * @deprecated
         * @secure
         */
        sjekkTilgangSakV21: (data: SjekkTilgangSakRequestDto, params: RequestParams = {}) =>
            this.request<boolean, any>({
                path: `/api/tilgang/v2/sak`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til fagtema
         *
         * @tags tilgangskontroller
         * @name SjekkTilgangTema1
         * @request POST:/api/tilgang/tema
         * @deprecated
         * @secure
         */
        sjekkTilgangTema1: (
            data: string,
            query?: {
                navIdent?: string;
            },
            params: RequestParams = {}
        ) =>
            this.request<boolean, any>({
                path: `/api/tilgang/tema`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekk tilgang sak
         *
         * @tags tilgangskontroller
         * @name SjekkTilgangSak
         * @request POST:/api/tilgang/sak
         * @deprecated
         * @secure
         */
        sjekkTilgangSak: (data: string, params: RequestParams = {}) =>
            this.request<boolean, any>({
                path: `/api/tilgang/sak`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til person
         *
         * @tags tilgangskontroller
         * @name SjekkTilgangPerson1
         * @request POST:/api/tilgang/person
         * @deprecated
         * @secure
         */
        sjekkTilgangPerson1: (data: string, params: RequestParams = {}) =>
            this.request<boolean, any>({
                path: `/api/tilgang/person`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til person
         *
         * @tags tilgangskontroller
         * @name SjekkTilgangPersonISak
         * @request POST:/api/tilgang/person/sak
         * @deprecated
         * @secure
         */
        sjekkTilgangPersonISak: (data: SjekkTilgangPersonISakRequest, params: RequestParams = {}) =>
            this.request<boolean, any>({
                path: `/api/tilgang/person/sak`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker PDL om en person er beskyttet (skjerming eller adressebeskyttelse).
         *
         * @tags tilgangskontroller
         * @name HarBeskyttelse
         * @request POST:/api/tilgang/person/beskyttelse
         * @deprecated
         * @secure
         */
        harBeskyttelse: (data: string, params: RequestParams = {}) =>
            this.request<boolean, any>({
                path: `/api/tilgang/person/beskyttelse`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til å opprette sak uten BM og bare med BP og barn
         *
         * @tags tilgangskontroller
         * @name SjekkTilgangOpprettSakUtenBm1
         * @request POST:/api/tilgang/opprettsakutenbm
         * @deprecated
         * @secure
         */
        sjekkTilgangOpprettSakUtenBm1: (params: RequestParams = {}) =>
            this.request<boolean, any>({
                path: `/api/tilgang/opprettsakutenbm`,
                method: "POST",
                secure: true,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekk tilgang sak
         *
         * @tags sporingsdata-controller
         * @name HentSakSporingsdata1
         * @request POST:/api/sporingsdata/sak
         * @secure
         */
        hentSakSporingsdata1: (data: string, params: RequestParams = {}) =>
            this.request<Sporingsdata, any>({
                path: `/api/sporingsdata/sak`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Sjekker om bruker har tilgang til person
         *
         * @tags sporingsdata-controller
         * @name HentPersonSporingsdata1
         * @request POST:/api/sporingsdata/person
         * @secure
         */
        hentPersonSporingsdata1: (data: string, params: RequestParams = {}) =>
            this.request<Sporingsdata, any>({
                path: `/api/sporingsdata/person`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
}
