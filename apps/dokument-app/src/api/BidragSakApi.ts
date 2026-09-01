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
    type: Rolletype;
    objektnummer?: string;
    reellMottager?: string;
    mottagerErVerge: boolean;
    samhandlerIdent?: string;
    foedselsnummer?: string;
    rolleType: Rolletype;
}

export enum Rolletype {
    BA = "BA",
    BM = "BM",
    BP = "BP",
    FR = "FR",
    RM = "RM",
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

/** Metadata for en bidragssak */
export interface BidragssakDto {
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
    /** @format date */
    opprettetDato: string;
    levdeAdskilt: boolean;
    /** Hvor vidt en av partene i saken er ukjent */
    ukjentPart: boolean;
    vedtakssperre: boolean;
    avsluttet: boolean;
    /** Rollene som saken inneholder */
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

/** Metadata for pip tjeneste (paragraf 19 på bidragssak, samt fnr for involverte roller */
export interface BidragssakPipDto {
    /** Saksnummeret til bidragssaken */
    saksnummer: string;
    /** Om saken omhandler paragraf 19 */
    erParagraf19: boolean;
    /** Om saken er avsluttet */
    avsluttet: boolean;
    /** Fødselsnummer til personer innvolvert i bidragssaken */
    roller: string[];
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
            baseURL: axiosConfig.baseURL || "https://bidrag-sak-q2.dev.intern.nav.no",
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
 * @baseUrl https://bidrag-sak-q2.dev.intern.nav.no
 */
export class Api<SecurityDataType> extends HttpClient<SecurityDataType> {
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
        findMetadataForSak: (saksnummer: string, params: RequestParams = {}) =>
            this.request<BidragssakDto, void>({
                path: `/bidrag-sak/sak/${saksnummer}`,
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
