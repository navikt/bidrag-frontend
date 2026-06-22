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

/** Søkbare felter for opphenting av samhandlere. */
export interface SamhandlerSok {
    ident?: string;
    offentligId?: string;
    navn?: string;
    postnummer?: string;
    poststed?: string;
    norskkontonr?: string;
    iban?: string;
    swift?: string;
    banknavn?: string;
    banklandkode?: string;
    bankcode?: string;
}

/** Representerer navn og/eller adresse for en samhandler. */
export interface AdresseDto {
    /** Første adresselinje inneholder normalt gatenavn, men kan også innehold f.eks c/o. */
    adresselinje1?: string;
    /** Andre adresselinje brukes primært i utlandsadresser, hvor postnr og poststed ikke er tilgjengelig som strukturerte data. */
    adresselinje2?: string;
    /** Tredje adresselinje brukes i noen tilfeller til region. */
    adresselinje3?: string;
    /**
     * Bruk postnnummer.
     * @deprecated
     */
    postnr?: string;
    /** Postnummer dersom dette er tilgjengelig som strukturerte data. */
    postnummer?: string;
    /** Poststed dersom dette er tilgjengelig som strukturerte data. */
    poststed?: string;
    /** Land. ISO 3166-1 alfa-3. */
    land?: string;
}

export interface AuditLogDto {
    /** Navnet på tabellen som ble endret. */
    tabellNavn: string;
    /**
     * Id til raden som ble endret.
     * @format int32
     */
    tabellId: number;
    /** Operasjonen som ble utført. */
    operasjon: string;
    /**
     * Tidspunkt for endringen.
     * @format date-time
     */
    endretTidspunkt: string;
    /** Brukeren som endret raden. Kan være et system, database-bruker eller saksbehandler. */
    endretAv: string;
    /** Verdiene som raden hadde før endringen. */
    gamleVerdier: string;
    /** Verdiene som raden har etter endringen. */
    nyeVerdier: string;
}

/** Representerer kontonummer for en samhandler. For norske kontonummer er det kun norskKontornr som er utfyllt, ellers benyttes de andre feltene for utlandske kontonummer. */
export interface KontonummerDto {
    /** Norsk kontonummer, 11 siffer. */
    norskKontonummer?: string;
    /** IBAN angir kontonummeret på et internasjonalt format. */
    iban?: string;
    /** SWIFT angir banken på et internasjonalt format. */
    swift?: string;
    /** Bankens navn. */
    banknavn?: string;
    /** Bankens landkode. ISO 3166-1 alfa-3. */
    landkodeBank?: string;
    /** BankCode. Format varierer. */
    bankCode?: string;
    /** Kontoens valuta. */
    valutakode?: Valutakode;
}

export enum OffentligIDType {
    ORG = "ORG",
    FNR = "FNR",
    UTOR = "UTOR",
    UTPE = "UTPE",
    DNR = "DNR",
    HPR = "HPR",
}

export interface SamhandlerDto {
    /** Identen til samhandler */
    samhandlerId?: string;
    /** Navn på samhandler */
    navn: string;
    /** Offentlig id for samhandlere. */
    offentligId: string;
    /** Type offentlig id. F.eks ORG for norske organisasjonsnummere, UTOR for utenlandske organisasjonsnummere, FNR for norske personnummer. */
    offentligIdType: OffentligIDType;
    /** Definerer hvilket område samhandleren er knyttet til. */
    områdekode?:
        | "UTENRIKSSTASJON"
        | "ADVOKAT"
        | "ARBEIDSGIVER"
        | "REELL_MOTTAKER"
        | "UTENLANDSK_PERSON"
        | "UTENLANDSK_FOGD"
        | "SOSIALKONTO"
        | "BARNEVERNSINSTITUSJON"
        | "VERGE";
    /** Språk til samhandleren. */
    språk?: Sprak;
    /** Samhandlerens adresse. */
    adresse?: AdresseDto;
    /** Samhandlerens kontonummer. */
    kontonummer?: KontonummerDto;
    /** Kontaktperson for samhandler. Benyttes primært av utland. */
    kontaktperson?: string;
    /** Kontakt epost for samhandler. Benyttes primært av utland. */
    kontaktEpost?: string;
    /** Kontakt telefon for samhandler. Benyttes primært av utland. */
    kontaktTelefon?: string;
    /** Fritekstfelt for notater. */
    notat?: string;
    /** Er samhandleren opphørt? */
    erOpphørt?: boolean;
    /** Liste over endringer på samhandleren. */
    auditLog?: AuditLogDto[];
}

/** Søkeresultat etter søk på samhandler. */
export interface SamhandlersokeresultatDto {
    samhandlere: SamhandlerDto[];
    /** True hvis det finnes flere forekomster enn det som er returnert i dette objektet. */
    flereForekomster: boolean;
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

export enum Valutakode {
    ALL = "ALL",
    ANG = "ANG",
    AUD = "AUD",
    BAM = "BAM",
    BGN = "BGN",
    BRL = "BRL",
    CAD = "CAD",
    CHF = "CHF",
    CNY = "CNY",
    CZK = "CZK",
    DKK = "DKK",
    EEK = "EEK",
    EUR = "EUR",
    GBP = "GBP",
    HKD = "HKD",
    HRK = "HRK",
    HUF = "HUF",
    INR = "INR",
    ISK = "ISK",
    JPY = "JPY",
    LTL = "LTL",
    LVL = "LVL",
    MAD = "MAD",
    NOK = "NOK",
    NZD = "NZD",
    PKR = "PKR",
    PLN = "PLN",
    RON = "RON",
    RSD = "RSD",
    SEK = "SEK",
    THB = "THB",
    TND = "TND",
    TRY = "TRY",
    UAH = "UAH",
    USD = "USD",
    VND = "VND",
    ZAR = "ZAR",
    PHP = "PHP",
}

export interface DuplikatSamhandler {
    feilmelding: string;
    eksisterendeSamhandlerId: string;
    felter: string[];
}

export interface FeltValideringsfeil {
    feltnavn: string;
    feilmelding: string;
}

export interface SamhandlerValideringsfeil {
    duplikatSamhandler?: DuplikatSamhandler[];
    ugyldigInput?: FeltValideringsfeil[];
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
            baseURL: axiosConfig.baseURL || "https://bidrag-samhandler-q2.intern.dev.nav.no",
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
 * @title bidrag-samhandler
 * @version v1
 * @baseUrl https://bidrag-samhandler-q2.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    samhandlersok = {
        /**
         * @description Søker etter samhandlere.
         *
         * @tags samhandler-controller
         * @name SamhandlerSok
         * @request POST:/samhandlersok
         * @secure
         */
        samhandlerSok: (data: SamhandlerSok, params: RequestParams = {}) =>
            this.request<SamhandlersokeresultatDto, any>({
                path: `/samhandlersok`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    samhandler = {
        /**
         * @description Henter samhandler for ident.
         *
         * @tags samhandler-controller
         * @name HentSamhandler
         * @request POST:/samhandler
         * @secure
         */
        hentSamhandler: (
            data: string,
            query?: {
                inkluderAuditLog?: boolean;
            },
            params: RequestParams = {}
        ) =>
            this.request<SamhandlerDto, object>({
                path: `/samhandler`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    opprettSamhandler = {
        /**
         * @description Oppretter samhandler.
         *
         * @tags samhandler-controller
         * @name OpprettSamhandler
         * @request POST:/opprettSamhandler
         * @secure
         */
        opprettSamhandler: (data: SamhandlerDto, params: RequestParams = {}) =>
            this.request<object, SamhandlerValideringsfeil>({
                path: `/opprettSamhandler`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    oppdaterSamhandler = {
        /**
         * @description Oppdaterer samhandler.
         *
         * @tags samhandler-controller
         * @name OppdaterSamhandler
         * @request POST:/oppdaterSamhandler
         * @secure
         */
        oppdaterSamhandler: (data: SamhandlerDto, params: RequestParams = {}) =>
            this.request<object, SamhandlerValideringsfeil>({
                path: `/oppdaterSamhandler`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    auditlog = {
        /**
         * @description Henter audit log for samhandler.
         *
         * @tags audit-log-controller
         * @name HentAuditLog
         * @request POST:/auditlog
         * @secure
         */
        hentAuditLog: (data: number, params: RequestParams = {}) =>
            this.request<AuditLogDto, any>({
                path: `/auditlog`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    visningsnavn = {
        /**
         * No description
         *
         * @tags visningsnavn-controller
         * @name HentVisningsnavn
         * @request GET:/visningsnavn
         * @secure
         */
        hentVisningsnavn: (params: RequestParams = {}) =>
            this.request<Record<string, string>, any>({
                path: `/visningsnavn`,
                method: "GET",
                secure: true,
                ...params,
            }),
    };
}
