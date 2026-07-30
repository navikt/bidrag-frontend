export enum EndringsloggTilhorerSkjermbilde {
    BEHANDLING_BIDRAG = "BEHANDLING_BIDRAG",
    BEHANDLING_FORSKUDD = "BEHANDLING_FORSKUDD",
    BEHANDLINGSAeRBIDRAG = "BEHANDLING_SÆRBIDRAG",
    BEHANDLING_ALLE = "BEHANDLING_ALLE",
    FORSENDELSE = "FORSENDELSE",
    INNSYN_DOKUMENT = "INNSYN_DOKUMENT",
    SAMHANDLER = "SAMHANDLER",
    ALLE = "ALLE",
}

export enum Endringstype {
    NYHET = "NYHET",
    ENDRING = "ENDRING",
    FEILFIKS = "FEILFIKS",
}

export interface OppdaterEndringsloggEndring {
    /** @format int64 */
    id: number;
    tittel?: string;
    innhold?: string;
    endringstype?: Endringstype;
}

export interface OppdaterEndringsloggRequest {
    tittel?: string;
    tilhørerSkjermbilde?: EndringsloggTilhorerSkjermbilde;
    sammendrag?: string;
    innhold?: string;
    erPåkrevd?: boolean;
    /** @format date */
    aktivFraTidspunkt?: string;
    /** @format date */
    aktivTilTidspunkt?: string;
    endringer?: OppdaterEndringsloggEndring[];
    endringstyper?: Endringstype[];
}

export enum AktivForMiljo {
    PROD = "PROD",
    DEV = "DEV",
}

export interface EndringsLoggDto {
    /** @format int64 */
    id: number;
    /**
     * Dato når endringsloggen ble publisert
     * @format date
     */
    dato: string;
    /** @format date */
    aktiv: boolean;
    /** @format date */
    aktivFra?: string;
    /** @format date */
    aktivTil?: string;
    /** Hvilken system/skjermbilde endringsloggen gjelder for */
    gjelder: EndringsloggTilhorerSkjermbilde;
    aktiveMiljøer: AktivForMiljo[];
    /** Tittel på endringsloggen */
    tittel: string;
    endringstyper: Endringstype[];
    /** Sammendrag av endringsloggen I HTML */
    sammendrag: string;
    /** Om det er påkrevd å lese endringsloggen. Dette skal føre til at det vises en modal første gang bruker åpner bidrag løsningen */
    erPåkrevd: boolean;
    /** Om endringsloggen er lest av bruker. Dette vil være sann hvis bruker har lest alle endringene i endringsloggen */
    erLestAvBruker: boolean;
    /** Om endringsloggen er sett av bruker. Dette vil være sann hvis bruker har sett endringsloggen men ikke har sett alle endringene i endringsloggen */
    erSettAvBruker: boolean;
    /** Liste over endringer i endringsloggen.  */
    endringer: EndringsLoggEndringDto[];
}

export interface EndringsLoggEndringDto {
    /** Innhold i endringen I HTML */
    innhold: string;
    tittel: string;
    endringstype: Endringstype;
    /** @format int64 */
    id: number;
    erLestAvBruker: boolean;
}

export interface OppdaterDriftsmeldingRequest {
    tittel?: string;
    /** @format date-time */
    aktivFraTidspunkt?: string;
    /** @format date-time */
    aktivTilTidspunkt?: string;
}

export interface DriftsmeldingDto {
    /** @format int64 */
    id: number;
    /** @format date-time */
    tidspunkt: string;
    tittel: string;
    historikk: DriftsmeldingHistorikkDto[];
}

export interface DriftsmeldingHistorikkDto {
    /** @format int64 */
    id: number;
    /** @format date-time */
    tidspunkt: string;
    innhold: string;
    status: "KRITISK" | "VARSEL" | "INFO" | "AVSLUTTET";
    erLestAvBruker: boolean;
}

export interface OppdaterDriftsmeldingHistorikkRequest {
    innhold?: string;
    /** @format date-time */
    aktivFraTidspunkt?: string;
    /** @format date-time */
    aktivTilTidspunkt?: string;
    status?: "KRITISK" | "VARSEL" | "INFO" | "AVSLUTTET";
}

export interface LeggTilEndringsloggEndring {
    tittel: string;
    innhold: string;
    endringstype: Endringstype;
}

export interface OpprettEndringsloggRequest {
    tittel: string;
    tilhørerSkjermbilde: EndringsloggTilhorerSkjermbilde;
    sammendrag: string;
    innhold?: string;
    erPåkrevd: boolean;
    /** @format date */
    aktivFraTidspunkt?: string;
    /** @format date */
    aktivTilTidspunkt?: string;
    endringstyper: Endringstype[];
    endringer?: LeggTilEndringsloggEndring[];
}

export interface OpprettDriftsmeldingRequest {
    tittel: string;
    /** @format date-time */
    aktivFraTidspunkt?: string;
    /** @format date-time */
    aktivTilTidspunkt?: string;
    innhold: string;
    status: "KRITISK" | "VARSEL" | "INFO" | "AVSLUTTET";
}

export interface LeggTilDriftsmeldingHistorikkRequest {
    innhold: string;
    /** @format date-time */
    aktivFraTidspunkt?: string;
    /** @format date-time */
    aktivTilTidspunkt?: string;
    status: "KRITISK" | "VARSEL" | "INFO" | "AVSLUTTET";
}

import type {AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType} from "axios";
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

    constructor({securityWorker, secure, format, ...axiosConfig}: ApiConfig<SecurityDataType> = {}) {
        this.instance = axios.create({
            ...axiosConfig,
            baseURL: axiosConfig.baseURL || "https://bidrag-admin.intern.dev.nav.no",
        });
        this.secure = secure;
        this.format = format;
        this.securityWorker = securityWorker;
    }

    public setSecurityData = (data: SecurityDataType | null) => {
        this.securityData = data;
    };

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
                ...(type ? {"Content-Type": type} : {}),
            },
            params: query,
            responseType: responseFormat,
            data: body,
            url: path,
        });
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
}

/**
 * @title bidrag-admin
 * @version v1
 * @baseUrl https://bidrag-admin.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    endringslogg = {
        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name HentEndringslogg
         * @summary Hent en enkel endringslogg med id
         * @request GET:/endringslogg/{endringsloggId}
         * @secure
         */
        hentEndringslogg: (endringsloggId: number, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}`,
                method: "GET",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name OppdaterEndringslogg
         * @summary Oppdater endringslogg. Kan også bruke til å endre på rekkefølgene til endringene
         * @request PUT:/endringslogg/{endringsloggId}
         * @secure
         */
        oppdaterEndringslogg: (endringsloggId: number, data: OppdaterEndringsloggRequest, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}`,
                method: "PUT",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name SlettEndringslogg
         * @summary Hent en enkel endringslogg med id
         * @request DELETE:/endringslogg/{endringsloggId}
         * @secure
         */
        slettEndringslogg: (endringsloggId: number, params: RequestParams = {}) =>
            this.request<void, any>({
                path: `/endringslogg/${endringsloggId}`,
                method: "DELETE",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name HentAlleEndringslogg
         * @summary Hent liste over endringslogg for en skjermbilde eller alle
         * @request GET:/endringslogg
         * @secure
         */
        hentAlleEndringslogg: (
            query?: {
                skjermbilde?: EndringsloggTilhorerSkjermbilde;
                bareAktive?: boolean;
            },
            params: RequestParams = {}
        ) =>
            this.request<EndringsLoggDto[], any>({
                path: `/endringslogg`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name OpprettEndringslogg
         * @summary Opprett endringslogg
         * @request POST:/endringslogg
         * @secure
         */
        opprettEndringslogg: (data: OpprettEndringsloggRequest, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name OppdaterLestAvBrukerEndringslogg
         * @summary Oppdater endringslogg at den er lest av bruker. Brukerdetaljer hentes fra token
         * @request POST:/endringslogg/{endringsloggId}/lest
         * @secure
         */
        oppdaterLestAvBrukerEndringslogg: (endringsloggId: number, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}/lest`,
                method: "POST",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-endring-controller
         * @name OppdaterLestAvBrukerEndring
         * @summary Oppdater endringslogg at den er lest av bruker. Brukerdetaljer hentes fra token
         * @request POST:/endringslogg/{endringsloggId}/lest/{endringId}
         * @secure
         */
        oppdaterLestAvBrukerEndring: (endringsloggId: number, endringId: number, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}/lest/${endringId}`,
                method: "POST",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-endring-controller
         * @name LeggTilEndring
         * @summary Legg til en ny endring i endringslogg
         * @request POST:/endringslogg/{endringsloggId}/endring
         * @secure
         */
        leggTilEndring: (endringsloggId: number, data: LeggTilEndringsloggEndring, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}/endring`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name DeaktiverEndringslogg
         * @summary Deaktiver endringslogg
         * @request PATCH:/endringslogg/{endringsloggId}/deaktiver
         * @secure
         */
        deaktiverEndringslogg: (endringsloggId: number, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}/deaktiver`,
                method: "PATCH",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-controller
         * @name AktiverEndringslogg
         * @summary Aktiver endringslogg
         * @request PATCH:/endringslogg/{endringsloggId}/aktiver
         * @secure
         */
        aktiverEndringslogg: (endringsloggId: number, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}/aktiver`,
                method: "PATCH",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags endringslogg-endring-controller
         * @name SlettEndring
         * @summary Slett endringslogg endring
         * @request DELETE:/endringslogg/{endringsloggId}/endring/{endringId}
         * @secure
         */
        slettEndring: (endringsloggId: number, endringId: number, params: RequestParams = {}) =>
            this.request<EndringsLoggDto, any>({
                path: `/endringslogg/${endringsloggId}/endring/${endringId}`,
                method: "DELETE",
                secure: true,
                ...params,
            }),
    };
    driftsmelding = {
        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name HentDriftsmelding
         * @summary Hent en enkel driftsmelding
         * @request GET:/driftsmelding/{driftsmeldingId}
         * @secure
         */
        hentDriftsmelding: (driftsmeldingId: number, params: RequestParams = {}) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding/${driftsmeldingId}`,
                method: "GET",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name OppdaterDriftsmelding
         * @summary Oppdater driftsmelding
         * @request PUT:/driftsmelding/{driftsmeldingId}
         * @secure
         */
        oppdaterDriftsmelding: (
            driftsmeldingId: number,
            data: OppdaterDriftsmeldingRequest,
            params: RequestParams = {}
        ) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding/${driftsmeldingId}`,
                method: "PUT",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name OppdaterDriftsmeldingHistorikk
         * @summary Oppdater driftsmelding historikk
         * @request PUT:/driftsmelding/{driftsmeldingId}/historikk/{driftsmeldingHistorikkId}
         * @secure
         */
        oppdaterDriftsmeldingHistorikk: (
            driftsmeldingId: number,
            driftsmeldingHistorikkId: number,
            data: OppdaterDriftsmeldingHistorikkRequest,
            params: RequestParams = {}
        ) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding/${driftsmeldingId}/historikk/${driftsmeldingHistorikkId}`,
                method: "PUT",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name SlettDriftsmeldingHistorikk
         * @summary Slett driftsmelding historikk
         * @request DELETE:/driftsmelding/{driftsmeldingId}/historikk/{driftsmeldingHistorikkId}
         * @secure
         */
        slettDriftsmeldingHistorikk: (
            driftsmeldingId: number,
            driftsmeldingHistorikkId: number,
            params: RequestParams = {}
        ) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding/${driftsmeldingId}/historikk/${driftsmeldingHistorikkId}`,
                method: "DELETE",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name HentAlleAktiveDriftsmeldinger
         * @summary Hent alle aktive driftsmeldinger
         * @request GET:/driftsmelding
         * @secure
         */
        hentAlleAktiveDriftsmeldinger: (params: RequestParams = {}) =>
            this.request<DriftsmeldingDto[], any>({
                path: `/driftsmelding`,
                method: "GET",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name OpprettDriftsmelding
         * @summary Opprett driftsmelding
         * @request POST:/driftsmelding
         * @secure
         */
        opprettDriftsmelding: (data: OpprettDriftsmeldingRequest, params: RequestParams = {}) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name OppdaterLestAvBruker
         * @summary Oppdater at driftsmelding er lest av bruker. Brukerdetaljer hentes fra token
         * @request POST:/driftsmelding/{driftsmeldingId}/{driftsmeldingHistorikkId}/lest
         * @secure
         */
        oppdaterLestAvBruker: (driftsmeldingId: number, driftsmeldingHistorikkId: number, params: RequestParams = {}) =>
            this.request<void, any>({
                path: `/driftsmelding/${driftsmeldingId}/${driftsmeldingHistorikkId}/lest`,
                method: "POST",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name OpprettDriftsmeldingHistorikk
         * @summary Opprett driftsmelding historikk
         * @request POST:/driftsmelding/{driftsmeldingId}/historikk
         * @secure
         */
        opprettDriftsmeldingHistorikk: (
            driftsmeldingId: number,
            data: LeggTilDriftsmeldingHistorikkRequest,
            params: RequestParams = {}
        ) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding/${driftsmeldingId}/historikk`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name DeaktiverDriftsmelding
         * @summary Deaktiver driftsmelding
         * @request PATCH:/driftsmelding/{driftsmeldingId}/deaktiver
         * @secure
         */
        deaktiverDriftsmelding: (driftsmeldingId: number, params: RequestParams = {}) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding/${driftsmeldingId}/deaktiver`,
                method: "PATCH",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags driftsmelding-controller
         * @name AktiverDriftsmelding
         * @summary Aktiver driftsmelding
         * @request PATCH:/driftsmelding/{driftsmeldingId}/aktiver
         * @secure
         */
        aktiverDriftsmelding: (driftsmeldingId: number, params: RequestParams = {}) =>
            this.request<DriftsmeldingDto, any>({
                path: `/driftsmelding/${driftsmeldingId}/aktiver`,
                method: "PATCH",
                secure: true,
                ...params,
            }),
    };
}
