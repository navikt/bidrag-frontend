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

/** Innholdet i grunnlaget */
export type JsonNode = object;

/** Liste med referanser til alle behandlinger som ligger som grunnlag til vedtaket */
export interface OpprettBehandlingsreferanseRequestDto {
    /** Kilde/type for en behandlingsreferanse */
    kilde: "BEHANDLING_ID" | "BISYS_SOKNAD" | "BISYS_KLAGE_REF_SOKNAD";
    /** Kildesystemets referanse til behandlingen */
    referanse: string;
}

/** Liste over alle engangsbeløp som inngår i vedtaket */
export interface OpprettEngangsbelopRequestDto {
    /** Beløpstype. Saertilskudd, gebyr m.m. */
    type:
        | "DIREKTE_OPPGJOR"
        | "ETTERGIVELSE"
        | "ETTERGIVELSE_TILBAKEKREVING"
        | "GEBYR_MOTTAKER"
        | "GEBYR_SKYLDNER"
        | "INNKREVING_GJELD"
        | "SAERTILSKUDD"
        | "TILBAKEKREVING";
    /** Referanse til sak */
    sakId: string;
    /** Id til den som skal betale engangsbeløpet */
    skyldnerId: string;
    /** Id til den som krever engangsbeløpet */
    kravhaverId: string;
    /** Id til den som mottar engangsbeløpet */
    mottakerId: string;
    /**
     * Beregnet engangsbeløp
     * @min 0
     */
    belop?: number;
    /** Valutakoden tilhørende engangsbeløpet */
    valutakode: string;
    /** Resultatkoden tilhørende engangsbeløpet */
    resultatkode: string;
    /** Angir om engangsbeløpet skal innkreves */
    innkreving: "JA" | "NEI";
    /** Angir om et engangsbeløp skal endres som følge av vedtaket */
    endring: boolean;
    /**
     * VedtakId for vedtaket det er klaget på. Utgjør sammen med referanse en unik id for et engangsbeløp
     * @format int32
     */
    omgjorVedtakId?: number;
    /** Referanse, brukes for å kunne omgjøre engangsbeløp senere i et klagevedtak. Unik innenfor et vedtak */
    referanse: string;
    /** Referanse - delytelsesId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
    delytelseId?: string;
    /** Referanse som brukes i utlandssaker */
    eksternReferanse?: string;
    /** Liste over alle grunnlag som inngår i engangsbeløpet */
    grunnlagReferanseListe: string[];
}

/** Liste over alle grunnlag som inngår i vedtaket */
export interface OpprettGrunnlagRequestDto {
    /** Referanse til grunnlaget */
    referanse: string;
    /** Grunnlagstype */
    type:
        | "SAERFRADRAG"
        | "SOKNADSBARN_INFO"
        | "SKATTEKLASSE"
        | "BARN_I_HUSSTAND"
        | "BOSTATUS"
        | "BOSTATUS_BP"
        | "INNTEKT"
        | "INNTEKT_BARN"
        | "INNTEKT_UTVIDET_BARNETRYGD"
        | "KAPITALINNTEKT"
        | "KAPITALINNTEKT_BARN"
        | "NETTO_SAERTILSKUDD"
        | "SAMVAERSKLASSE"
        | "BIDRAGSEVNE"
        | "SAMVAERSFRADRAG"
        | "SJABLON"
        | "LOPENDE_BIDRAG"
        | "FAKTISK_UTGIFT"
        | "BARNETILSYN_MED_STONAD"
        | "FORPLEINING_UTGIFT"
        | "BARN"
        | "SIVILSTAND"
        | "BARNETILLEGG"
        | "BARNETILLEGG_FORSVARET"
        | "DELT_BOSTED"
        | "NETTO_BARNETILSYN"
        | "UNDERHOLDSKOSTNAD"
        | "BPS_ANDEL_UNDERHOLDSKOSTNAD"
        | "TILLEGGSBIDRAG"
        | "MAKS_BIDRAG_PER_BARN"
        | "BPS_ANDEL_SAERTILSKUDD"
        | "MAKS_GRENSE_25_INNTEKT"
        | "GEBYRFRITAK"
        | "SOKNAD_INFO"
        | "BARN_INFO"
        | "PERSON_INFO"
        | "SAKSBEHANDLER_INFO"
        | "VEDTAK_INFO"
        | "INNBETALT_BELOP"
        | "FORHOLDSMESSIG_FORDELING"
        | "SLUTTBEREGNING_BBM"
        | "KLAGE_STATISTIKK";
    /** Innholdet i grunnlaget */
    innhold: JsonNode;
}

/** Liste over alle stønadsendringer som inngår i vedtaket */
export interface OpprettStonadsendringRequestDto {
    /** Stønadstype */
    type: "BIDRAG" | "FORSKUDD" | "BIDRAG18AAR" | "EKTEFELLEBIDRAG" | "MOTREGNING" | "OPPFOSTRINGSBIDRAG";
    /** Referanse til sak */
    sakId: string;
    /** Id til den som skal betale bidraget */
    skyldnerId: string;
    /** Id til den som krever bidraget */
    kravhaverId: string;
    /** Id til den som mottar bidraget */
    mottakerId: string;
    /** Angir første år en stønad skal indeksreguleres */
    indeksreguleringAar?: string;
    /** Angir om stønaden skal innkreves */
    innkreving: "JA" | "NEI";
    /** Angir om en stønad skal endres som følge av vedtaket */
    endring: boolean;
    /**
     * VedtakId for vedtaket det er klaget på
     * @format int32
     */
    omgjorVedtakId?: number;
    /** Referanse som brukes i utlandssaker */
    eksternReferanse?: string;
    /** Liste over alle perioder som inngår i stønadsendringen */
    periodeListe: OpprettVedtakPeriodeRequestDto[];
}

/** Liste over alle perioder som inngår i stønadsendringen */
export interface OpprettVedtakPeriodeRequestDto {
    /**
     * Periode fra-og-med-dato
     * @format date
     */
    fomDato: string;
    /**
     * Periode til-dato
     * @format date
     */
    tilDato?: string;
    /**
     * Beregnet stønadsbeløp
     * @min 0
     */
    belop?: number;
    /** Valutakoden tilhørende stønadsbeløpet */
    valutakode: string;
    /** Resultatkoden tilhørende stønadsbeløpet */
    resultatkode: string;
    /** Referanse - delytelsesId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
    delytelseId?: string;
    /** Liste over alle grunnlag som inngår i perioden */
    grunnlagReferanseListe: string[];
}

export interface OpprettVedtakRequestDto {
    /** Hva er kilden til vedtaket. Automatisk eller manuelt */
    kilde: "MANUELT" | "AUTOMATISK";
    /** Type vedtak */
    type:
        | "INDEKSREGULERING"
        | "ALDERSJUSTERING"
        | "OPPHØR"
        | "ALDERSOPPHØR"
        | "REVURDERING"
        | "FASTSETTELSE"
        | "INNKREVING"
        | "KLAGE"
        | "ENDRING"
        | "ENDRING_MOTTAKER";
    /**
     * Id til saksbehandler/batchjobb evt. annet som oppretter vedtaket
     * @minLength 5
     * @maxLength 2147483647
     */
    opprettetAv: string;
    /** Saksbehandlers navn */
    opprettetAvNavn?: string;
    /**
     * Tidspunkt/timestamp når vedtaket er fattet
     * @format date-time
     */
    vedtakTidspunkt: string;
    /** Id til enheten som er ansvarlig for vedtaket */
    enhetId: string;
    /**
     * Settes hvis overføring til Elin skal utsettes
     * @format date
     */
    utsattTilDato?: string;
    /** Liste over alle grunnlag som inngår i vedtaket */
    grunnlagListe: OpprettGrunnlagRequestDto[];
    /** Liste over alle stønadsendringer som inngår i vedtaket */
    stonadsendringListe?: OpprettStonadsendringRequestDto[];
    /** Liste over alle engangsbeløp som inngår i vedtaket */
    engangsbelopListe?: OpprettEngangsbelopRequestDto[];
    /** Liste med referanser til alle behandlinger som ligger som grunnlag til vedtaket */
    behandlingsreferanseListe?: OpprettBehandlingsreferanseRequestDto[];
}

/** Liste med referanser til alle behandlinger som ligger som grunnlag til vedtaket */
export interface BehandlingsreferanseDto {
    /** Kilde/type for en behandlingsreferanse */
    kilde: "BEHANDLING_ID" | "BISYS_SOKNAD" | "BISYS_KLAGE_REF_SOKNAD";
    /** Kildesystemets referanse til behandlingen */
    referanse: string;
}

/** Liste over alle engangsbeløp som inngår i vedtaket */
export interface EngangsbelopDto {
    /** Type Engangsbeløp. Saertilskudd, gebyr m.m. */
    type:
        | "DIREKTE_OPPGJOR"
        | "ETTERGIVELSE"
        | "ETTERGIVELSE_TILBAKEKREVING"
        | "GEBYR_MOTTAKER"
        | "GEBYR_SKYLDNER"
        | "INNKREVING_GJELD"
        | "SAERTILSKUDD"
        | "TILBAKEKREVING";
    /** Referanse til sak */
    sakId: string;
    /** Id til den som skal betale engangsbeløpet */
    skyldnerId: string;
    /** Id til den som krever engangsbeløpet */
    kravhaverId: string;
    /** Id til den som mottar engangsbeløpet */
    mottakerId: string;
    /** Beregnet engangsbeløp */
    belop?: number;
    /** Valutakoden tilhørende engangsbeløpet */
    valutakode?: string;
    /** Resultatkoden tilhørende engangsbeløpet */
    resultatkode: string;
    /** Angir om engangsbeløpet skal innkreves */
    innkreving: "JA" | "NEI";
    /** Angir om et engangsbeløp skal endres som følge av vedtaket */
    endring: boolean;
    /**
     * VedtakId for vedtaket det er klaget på. Utgjør sammen med referanse en unik id for et engangsbeløp
     * @format int32
     */
    omgjorVedtakId?: number;
    /** Referanse, brukes for å kunne omgjøre engangsbeløp senere i et klagevedtak. Unik innenfor et vedtak */
    referanse: string;
    /** Referanse - delytelsesId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
    delytelseId?: string;
    /** Referanse som brukes i utlandssaker */
    eksternReferanse?: string;
    /** Liste over alle grunnlag som inngår i beregningen */
    grunnlagReferanseListe: string[];
}

/** Liste over alle grunnlag som inngår i vedtaket */
export interface GrunnlagDto {
    /** Referanse til grunnlaget */
    referanse: string;
    /** Grunnlagstype */
    type:
        | "SAERFRADRAG"
        | "SOKNADSBARN_INFO"
        | "SKATTEKLASSE"
        | "BARN_I_HUSSTAND"
        | "BOSTATUS"
        | "BOSTATUS_BP"
        | "INNTEKT"
        | "INNTEKT_BARN"
        | "INNTEKT_UTVIDET_BARNETRYGD"
        | "KAPITALINNTEKT"
        | "KAPITALINNTEKT_BARN"
        | "NETTO_SAERTILSKUDD"
        | "SAMVAERSKLASSE"
        | "BIDRAGSEVNE"
        | "SAMVAERSFRADRAG"
        | "SJABLON"
        | "LOPENDE_BIDRAG"
        | "FAKTISK_UTGIFT"
        | "BARNETILSYN_MED_STONAD"
        | "FORPLEINING_UTGIFT"
        | "BARN"
        | "SIVILSTAND"
        | "BARNETILLEGG"
        | "BARNETILLEGG_FORSVARET"
        | "DELT_BOSTED"
        | "NETTO_BARNETILSYN"
        | "UNDERHOLDSKOSTNAD"
        | "BPS_ANDEL_UNDERHOLDSKOSTNAD"
        | "TILLEGGSBIDRAG"
        | "MAKS_BIDRAG_PER_BARN"
        | "BPS_ANDEL_SAERTILSKUDD"
        | "MAKS_GRENSE_25_INNTEKT"
        | "GEBYRFRITAK"
        | "SOKNAD_INFO"
        | "BARN_INFO"
        | "PERSON_INFO"
        | "SAKSBEHANDLER_INFO"
        | "VEDTAK_INFO"
        | "INNBETALT_BELOP"
        | "FORHOLDSMESSIG_FORDELING"
        | "SLUTTBEREGNING_BBM"
        | "KLAGE_STATISTIKK";
    /** Innholdet i grunnlaget */
    innhold: JsonNode;
}

/** Liste over alle stønadsendringer som inngår i vedtaket */
export interface StonadsendringDto {
    /** Stønadstype */
    type: "BIDRAG" | "FORSKUDD" | "BIDRAG18AAR" | "EKTEFELLEBIDRAG" | "MOTREGNING" | "OPPFOSTRINGSBIDRAG";
    /** Referanse til sak */
    sakId: string;
    /** Id til den som skal betale bidraget */
    skyldnerId: string;
    /** Id til den som krever bidraget */
    kravhaverId: string;
    /** Id til den som mottar bidraget */
    mottakerId: string;
    /** Angir første år en stønad skal indeksreguleres */
    indeksreguleringAar?: string;
    /** Angir om stønaden skal innkreves */
    innkreving: "JA" | "NEI";
    /** Angir om en stønad skal endres som følge av vedtaket */
    endring: boolean;
    /**
     * VedtakId for vedtaket det er klaget på
     * @format int32
     */
    omgjorVedtakId?: number;
    /** Referanse som brukes i utlandssaker */
    eksternReferanse?: string;
    /** Liste over alle perioder som inngår i stønadsendringen */
    periodeListe: VedtakPeriodeDto[];
}

export interface VedtakDto {
    /** Hva er kilden til vedtaket. Automatisk eller manuelt */
    kilde: "MANUELT" | "AUTOMATISK";
    /** Type vedtak */
    type:
        | "INDEKSREGULERING"
        | "ALDERSJUSTERING"
        | "OPPHØR"
        | "ALDERSOPPHØR"
        | "REVURDERING"
        | "FASTSETTELSE"
        | "INNKREVING"
        | "KLAGE"
        | "ENDRING"
        | "ENDRING_MOTTAKER";
    /** Id til saksbehandler/batchjobb evt annet som opprettet vedtaket */
    opprettetAv: string;
    /** Saksbehandlers navn */
    opprettetAvNavn?: string;
    /**
     * Tidspunkt/timestamp når vedtaket er fattet
     * @format date-time
     */
    vedtakTidspunkt: string;
    /** Id til enheten som er ansvarlig for vedtaket */
    enhetId: string;
    /**
     * Settes hvis overføring til Elin skal utsettes
     * @format date
     */
    utsattTilDato?: string;
    /**
     * Tidspunkt vedtaket er fattet
     * @format date-time
     */
    opprettetTidspunkt: string;
    /** Liste over alle grunnlag som inngår i vedtaket */
    grunnlagListe: GrunnlagDto[];
    /** Liste over alle stønadsendringer som inngår i vedtaket */
    stonadsendringListe: StonadsendringDto[];
    /** Liste over alle engangsbeløp som inngår i vedtaket */
    engangsbelopListe: EngangsbelopDto[];
    /** Liste med referanser til alle behandlinger som ligger som grunnlag til vedtaket */
    behandlingsreferanseListe: BehandlingsreferanseDto[];
}

/** Liste over alle perioder som inngår i stønadsendringen */
export interface VedtakPeriodeDto {
    /**
     * Periode fra-og-med-dato
     * @format date
     */
    fomDato: string;
    /**
     * Periode til-dato
     * @format date
     */
    tilDato?: string;
    /** Beregnet stønadsbeløp */
    belop?: number;
    /** Valutakoden tilhørende stønadsbeløpet */
    valutakode?: string;
    /** Resultatkoden tilhørende  stønadsbeløpet */
    resultatkode: string;
    /** Referanse - delytelsesId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
    delytelseId?: string;
    /** Liste over alle grunnlag som inngår i perioden */
    grunnlagReferanseListe: string[];
}

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from "axios";

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
            baseURL: axiosConfig.baseURL || "https://bidrag-vedtak-q2.intern.dev.nav.no",
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
                ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
            },
            params: query,
            responseType: responseFormat,
            data: body,
            url: path,
        });
    };
}

/**
 * @title bidrag-vedtak
 * @version v1
 * @baseUrl https://bidrag-vedtak-feature.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    vedtak = {
        /**
         * No description
         *
         * @tags vedtak-controller
         * @name OppdaterVedtak
         * @summary Oppdaterer grunnlag på et eksisterende vedtak
         * @request POST:/vedtak/oppdater/{vedtakId}
         * @secure
         */
        oppdaterVedtak: (vedtakId: number, data: OpprettVedtakRequestDto, params: RequestParams = {}) =>
            this.request<number, void>({
                path: `/vedtak/oppdater/${vedtakId}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags vedtak-controller
         * @name OpprettVedtak
         * @summary Oppretter nytt vedtak
         * @request POST:/vedtak/
         * @secure
         */
        opprettVedtak: (data: OpprettVedtakRequestDto, params: RequestParams = {}) =>
            this.request<number, void>({
                path: `/vedtak/`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags vedtak-controller
         * @name HentVedtak
         * @summary Henter et vedtak
         * @request GET:/vedtak/{vedtakId}
         * @secure
         */
        hentVedtak: (vedtakId: number, params: RequestParams = {}) =>
            this.request<VedtakDto, void>({
                path: `/vedtak/${vedtakId}`,
                method: "GET",
                secure: true,
                ...params,
            }),
    };
}
