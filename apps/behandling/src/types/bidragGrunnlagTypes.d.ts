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

export interface HentSkattegrunnlagRequest {
    inntektsAar: string;
    inntektsFilter: string;
    personId: string;
}

export interface HentSkattegrunnlagResponse {
    grunnlag?: Skattegrunnlag[];
    svalbardGrunnlag?: Skattegrunnlag[];
    skatteoppgjoersdato?: string;
}

export interface Skattegrunnlag {
    beloep: string;
    tekniskNavn: string;
}

export interface SivilstandRequest {
    personId: string;
    /** @format date */
    periodeFra: string;
}

export interface SivilstandResponse {
    type: string;
    /** @format date */
    gyldigFraOgMed?: string;
    /** @format date */
    bekreftelsesdato?: string;
}

export interface SivilstandResponseDto {
    sivilstand?: SivilstandResponse[];
}

export interface BisysDto {
    /** @format date */
    fom: string;
    identer: string[];
}

export interface Barn {
    /** @format int32 */
    beløp: number;
    ident: string;
}

export interface BisysResponsDto {
    infotrygdPerioder: InfotrygdPeriode[];
    ksSakPerioder: KsSakPeriode[];
}

export interface InfotrygdPeriode {
    fomMåned: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    tomMåned?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    /** @format int32 */
    beløp: number;
    barna: string[];
}

export interface KsSakPeriode {
    fomMåned: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    tomMåned?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    barn: Barn;
}

export interface HusstandsmedlemmerRequest {
    personId: string;
    /** @format date */
    periodeFra: string;
}

export interface HusstandResponse {
    /** @format date */
    gyldigFraOgMed?: string;
    /** @format date */
    gyldigTilOgMed?: string;
    adressenavn?: string;
    husnummer?: string;
    husbokstav?: string;
    bruksenhetsnummer?: string;
    postnummer?: string;
    bydelsnummer?: string;
    kommunenummer?: string;
    /** @format int64 */
    matrikkelId?: number;
    husstandsmedlemmerResponseListe: HusstandsmedlemmerResponse[];
}

export interface HusstandsmedlemmerResponse {
    /** @format date */
    gyldigFraOgMed?: string;
    /** @format date */
    gyldigTilOgMed?: string;
    personId?: string;
    fornavn?: string;
    mellomnavn?: string;
    etternavn?: string;
    /** @format date */
    foedselsdato?: string;
    /** @format date */
    doedsdato?: string;
}

export interface HusstandsmedlemmerResponseDto {
    husstandResponseListe?: HusstandResponse[];
}

export interface NavnFoedselDoedResponseDto {
    navn?: string;
    /** @format date */
    foedselsdato?: string;
    /** @format int32 */
    foedselsaar: number;
    /** @format date */
    doedsdato?: string;
}

export interface ForelderBarnRequest {
    personId: string;
    /** @format date */
    periodeFra: string;
}

export interface ForelderBarnRelasjonResponse {
    relatertPersonsIdent: string;
    relatertPersonsRolle: "BARN" | "FAR" | "MEDMOR" | "MOR";
    minRolleForPerson?: "BARN" | "FAR" | "MEDMOR" | "MOR";
}

export interface ForelderBarnRelasjonResponseDto {
    forelderBarnRelasjonResponse?: ForelderBarnRelasjonResponse[];
}

export interface FamilieBaSakRequest {
    personIdent: string;
    /** @format date */
    fraDato: string;
}

export interface FamilieBaSakResponse {
    perioder: UtvidetBarnetrygdPeriode[];
}

export interface UtvidetBarnetrygdPeriode {
    stønadstype: "UTVIDET" | "SMÅBARNSTILLEGG";
    fomMåned: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    tomMåned?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    /** @format double */
    beløp: number;
    manueltBeregnet: boolean;
    deltBosted: boolean;
}

export interface BarnetilsynRequest {
    ident: string;
    /** @format date */
    fomDato: string;
}

export interface BarnetilsynBisysPerioder {
    periode: Periode;
    barnIdenter: string[];
}

export interface BarnetilsynResponse {
    barnetilsynBisysPerioder: BarnetilsynBisysPerioder[];
}

export interface Periode {
    /** @format date */
    fom: string;
    /** @format date */
    tom: string;
}

export interface HentBarnetilleggPensjonRequest {
    mottaker: string;
    /** @format date */
    fom: string;
    /** @format date */
    tom: string;
    returnerFellesbarn: boolean;
    returnerSaerkullsbarn: boolean;
}

export interface BarnetilleggPensjon {
    barn: string;
    beloep: number;
    /** @format date */
    fom: string;
    /** @format date */
    tom?: string;
    erFellesbarn: boolean;
}

export interface HentBarnetilleggPensjonResponse {
    barnetilleggPensjonListe?: BarnetilleggPensjon[];
}

export interface HentInntektRequest {
    ident: string;
    /** @format date */
    innsynHistoriskeInntekterDato?: string;
    maanedFom: string;
    maanedTom: string;
    ainntektsfilter: string;
    formaal: string;
}

export interface Aktoer {
    identifikator?: string;
    aktoerType?: "AKTOER_ID" | "NATURLIG_IDENT" | "ORGANISASJON";
}

export type AldersUfoereEtterlatteAvtalefestetOgKrigspensjon = TilleggsinformasjonDetaljer & {
    grunnpensjonbeloep?: number;
    heravEtterlattepensjon?: number;
    /** @format int32 */
    pensjonsgrad?: number;
    /** @format date */
    tidsromFom?: string;
    /** @format date */
    tidsromTom?: string;
    tilleggspensjonbeloep?: number;
    /** @format int32 */
    ufoeregradpensjonsgrad?: number;
};

export interface ArbeidsInntektInformasjon {
    arbeidsforholdListe?: ArbeidsforholdFrilanser[];
    inntektListe?: Inntekt[];
    forskuddstrekkListe?: Forskuddstrekk[];
    fradragListe?: Fradrag[];
}

export interface ArbeidsInntektMaaned {
    aarMaaned?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    avvikListe?: Avvik[];
    arbeidsInntektInformasjon?: ArbeidsInntektInformasjon;
}

export interface ArbeidsforholdFrilanser {
    /** @format double */
    antallTimerPerUkeSomEnFullStillingTilsvarer?: number;
    arbeidstidsordning?: string;
    avloenningstype?: string;
    /** @format date */
    sisteDatoForStillingsprosentendring?: string;
    /** @format date */
    sisteLoennsendring?: string;
    /** @format date */
    frilansPeriodeFom?: string;
    /** @format date */
    frilansPeriodeTom?: string;
    /** @format double */
    stillingsprosent?: number;
    yrke?: string;
    arbeidsforholdID?: string;
    arbeidsforholdIDnav?: string;
    arbeidsforholdstype?: string;
    arbeidsgiver?: Aktoer;
    arbeidstaker?: Aktoer;
}

export interface Avvik {
    ident?: Aktoer;
    opplysningspliktig?: Aktoer;
    virksomhet?: Aktoer;
    avvikPeriode?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    tekst?: string;
}

export type BarnepensjonOgUnderholdsbidrag = TilleggsinformasjonDetaljer & {
    forsoergersFoedselnummer?: string;
    /** @format date */
    tidsromFom?: string;
    /** @format date */
    tidsromTom?: string;
};

export type BonusFraForsvaret = TilleggsinformasjonDetaljer & {
    aaretUtbetalingenGjelderFor?: {
        /** @format int32 */
        value?: number;
        leap?: boolean;
    };
};

export type Etterbetalingsperiode = TilleggsinformasjonDetaljer & {
    /** @format date */
    etterbetalingsperiodeFom?: string;
    /** @format date */
    etterbetalingsperiodeTom?: string;
};

export interface Forskuddstrekk {
    /** @format int32 */
    beloep?: number;
    beskrivelse?: string;
    /** @format date-time */
    leveringstidspunkt?: string;
    opplysningspliktig?: Aktoer;
    utbetaler?: Aktoer;
    forskuddstrekkGjelder?: Aktoer;
}

export interface Fradrag {
    beloep?: number;
    beskrivelse?: string;
    fradragsperiode?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    /** @format date-time */
    leveringstidspunkt?: string;
    inntektspliktig?: Aktoer;
    utbetaler?: Aktoer;
    fradragGjelder?: Aktoer;
}

export interface HentInntektListeResponse {
    arbeidsInntektMaaned?: ArbeidsInntektMaaned[];
    ident?: Aktoer;
}

export interface Inntekt {
    inntektType?: "LOENNSINNTEKT" | "NAERINGSINNTEKT" | "PENSJON_ELLER_TRYGD" | "YTELSE_FRA_OFFENTLIGE";
    arbeidsforholdREF?: string;
    beloep?: number;
    fordel?: string;
    inntektskilde?: string;
    inntektsperiodetype?: string;
    inntektsstatus?: string;
    leveringstidspunkt?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    opptjeningsland?: string;
    /** @format date */
    opptjeningsperiodeFom?: string;
    /** @format date */
    opptjeningsperiodeTom?: string;
    skattemessigBosattLand?: string;
    utbetaltIMaaned?: {
        /** @format int32 */
        year?: number;
        month?:
            | "JANUARY"
            | "FEBRUARY"
            | "MARCH"
            | "APRIL"
            | "MAY"
            | "JUNE"
            | "JULY"
            | "AUGUST"
            | "SEPTEMBER"
            | "OCTOBER"
            | "NOVEMBER"
            | "DECEMBER";
        /** @format int32 */
        monthValue?: number;
        leapYear?: boolean;
    };
    opplysningspliktig?: Aktoer;
    virksomhet?: Aktoer;
    tilleggsinformasjon?: Tilleggsinformasjon;
    inntektsmottaker?: Aktoer;
    inngaarIGrunnlagForTrekk?: boolean;
    utloeserArbeidsgiveravgift?: boolean;
    informasjonsstatus?: string;
    beskrivelse?: string;
    skatteOgAvgiftsregel?: string;
    /** @format int32 */
    antall?: number;
}

export type Inntjeningsforhold = TilleggsinformasjonDetaljer & {
    spesielleInntjeningsforhold?: string;
};

export type ReiseKostOgLosji = TilleggsinformasjonDetaljer & {
    persontype?: string;
};

export type Svalbardinntekt = TilleggsinformasjonDetaljer & {
    /** @format int32 */
    antallDager?: number;
    betaltTrygdeavgift?: number;
};

export interface Tilleggsinformasjon {
    kategori?: string;
    tilleggsinformasjonDetaljer?:
        | TilleggsinformasjonDetaljer
        | AldersUfoereEtterlatteAvtalefestetOgKrigspensjon
        | BarnepensjonOgUnderholdsbidrag
        | BonusFraForsvaret
        | Etterbetalingsperiode
        | Inntjeningsforhold
        | ReiseKostOgLosji
        | Svalbardinntekt;
}

export interface TilleggsinformasjonDetaljer {
    detaljerType: string;
}

/** Request for å opprette ny grunnlagspakke, uten annet innhold */
export interface OpprettGrunnlagspakkeRequestDto {
    /** Til hvilket formål skal grunnlagspakken benyttes. BIDRAG, FORSKUDD eller SAERTILSKUDD */
    formaal: "FORSKUDD" | "BIDRAG" | "SAERTILSKUDD";
    /** opprettet av */
    opprettetAv: string;
}

/** Liste over hvilke typer grunnlag som skal hentes inn. På nivået under er personId og perioder angitt */
export interface GrunnlagRequestDto {
    /** Hvilken type grunnlag skal hentes */
    type:
        | "AINNTEKT"
        | "SKATTEGRUNNLAG"
        | "UTVIDET_BARNETRYGD_OG_SMAABARNSTILLEGG"
        | "BARNETILLEGG"
        | "HUSSTANDSMEDLEMMER"
        | "EGNE_BARN_I_HUSSTANDEN"
        | "EGNE_BARN"
        | "SIVILSTAND"
        | "KONTANTSTOTTE"
        | "BARNETILSYN";
    /**
     * Angir personId som grunnlag skal hentes for
     * @pattern ^[0-9]{11}$
     */
    personId: string;
    /**
     * Første periode det skal hentes ut grunnlag for (på formatet YYYY-MM-DD)
     * @format date
     */
    periodeFra: string;
    /**
     * Grunnlag skal hentes TIL denne perioden, på formatet YYYY-MM-DD
     * @format date
     */
    periodeTil: string;
}

export interface OppdaterGrunnlagspakkeRequestDto {
    /**
     * Opplysningene som hentes er gyldige til (men ikke med) denne datoen (YYYY-MM-DD
     * @format date
     */
    gyldigTil?: string;
    /** Liste over hvilke typer grunnlag som skal hentes inn. På nivået under er personId og perioder angitt */
    grunnlagRequestDtoListe: GrunnlagRequestDto[];
}

/** Liste over grunnlagene som er hentet inn med person-id og status */
export interface OppdaterGrunnlagDto {
    /** Hvilken type grunnlag som er hentet */
    type:
        | "AINNTEKT"
        | "SKATTEGRUNNLAG"
        | "UTVIDET_BARNETRYGD_OG_SMAABARNSTILLEGG"
        | "BARNETILLEGG"
        | "HUSSTANDSMEDLEMMER"
        | "EGNE_BARN_I_HUSSTANDEN"
        | "EGNE_BARN"
        | "SIVILSTAND"
        | "KONTANTSTOTTE"
        | "BARNETILSYN";
    /** Angir personId som grunnlag er hentet for */
    personId: string;
    /** Status for utført kall */
    status: "HENTET" | "IKKE_FUNNET" | "FEILET";
    /** Statusmelding for utført kall */
    statusMelding: string;
}

/** Respons ved oppdatering av  grunnlagspakke */
export interface OppdaterGrunnlagspakkeDto {
    /**
     * Grunnlagspakke-id
     * @format int32
     */
    grunnlagspakkeId: number;
    /** Liste over grunnlagene som er hentet inn med person-id og status */
    grunnlagTypeResponsListe: OppdaterGrunnlagDto[];
}

/** Periodisert liste over innhentede inntekter fra a-inntekt og underliggende poster */
export interface AinntektDto {
    /** Id til personen inntekten er rapportert for */
    personId: string;
    /**
     * Periode fra-dato
     * @format date
     */
    periodeFra: string;
    /**
     * Periode til-dato
     * @format date
     */
    periodeTil: string;
    /** Angir om en inntektsopplysning er aktiv */
    aktiv: boolean;
    /**
     * Tidspunkt inntekten taes i bruk
     * @format date-time
     */
    brukFra: string;
    /**
     * Tidspunkt inntekten ikke lenger er aktiv. Null betyr at inntekten er aktiv
     * @format date-time
     */
    brukTil?: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
    /** Liste over poster for innhentede inntektsposter */
    ainntektspostListe: AinntektspostDto[];
}

/** Liste over poster for innhentede inntektsposter */
export interface AinntektspostDto {
    /** Perioden innteksposten er utbetalt YYYYMM */
    utbetalingsperiode?: string;
    /**
     * Fra-dato for opptjening
     * @format date
     */
    opptjeningsperiodeFra?: string;
    /**
     * Til-dato for opptjening
     * @format date
     */
    opptjeningsperiodeTil?: string;
    /** Id til de som rapporterer inn inntekten */
    opplysningspliktigId?: string;
    /** Id til virksomheten som rapporterer inn inntekten */
    virksomhetId?: string;
    /** Type inntekt, Lonnsinntekt, Naeringsinntekt, Pensjon eller trygd, Ytelse fra offentlig */
    inntektType: string;
    /** Type fordel, Kontantytelse, Naturalytelse, Utgiftsgodtgjorelse */
    fordelType?: string;
    /** Beskrivelse av inntekt */
    beskrivelse?: string;
    /** Belop */
    belop: number;
    /**
     * Fra-dato etterbetaling
     * @format date
     */
    etterbetalingsperiodeFra?: string;
    /**
     * Til-dato etterbetaling
     * @format date
     */
    etterbetalingsperiodeTil?: string;
}

/** Periodisert liste over innhentet barnetillegg */
export interface BarnetilleggDto {
    /** Id til personen barnetillegg er rapportert for */
    partPersonId: string;
    /** Id til barnet barnetillegget er rapportert for */
    barnPersonId: string;
    /** Type barnetillegg */
    barnetilleggType: string;
    /**
     * Periode fra- og med måned
     * @format date
     */
    periodeFra: string;
    /**
     * Periode til- og med måned
     * @format date
     */
    periodeTil?: string;
    /** Angir om en stønad er aktiv */
    aktiv: boolean;
    /**
     * Tidspunkt stønaden taes i bruk
     * @format date-time
     */
    brukFra: string;
    /**
     * Tidspunkt stønaden ikke lenger er aktiv. Null betyr at stønaden er aktiv
     * @format date-time
     */
    brukTil?: string;
    /** Bruttobeløp */
    belopBrutto: number;
    /** Angir om barnet er felles- eller særkullsbarn */
    barnType: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
}

/** Periodisert liste over innhentet barnetilsyn */
export interface BarnetilsynDto {
    /** Id til personen som mottar barnetilsynet */
    partPersonId: string;
    /** Id til barnet barnetilsynet er for */
    barnPersonId: string;
    /**
     * Periode fra-dato
     * @format date
     */
    periodeFra: string;
    /**
     * Periode til-dato
     * @format date
     */
    periodeTil?: string;
    /** Angir om en inntektsopplysning er aktiv */
    aktiv: boolean;
    /**
     * Tidspunkt inntekten tas i bruk
     * @format date-time
     */
    brukFra: string;
    /**
     * Tidspunkt inntekten ikke lenger aktiv. Null betyr at inntekten er aktiv
     * @format date-time
     */
    brukTil?: string;
    /**
     * Beløpet barnetilsynet er på
     * @format int32
     */
    belop?: number;
    /** Angir om barnetilsynet er heltid eller deltid */
    tilsynstype?: "HELTID" | "DELTID" | "IKKE_ANGITT";
    /** Angir om barnet er over eller under skolealder */
    skolealder?: "OVER" | "UNDER" | "IKKE_ANGITT";
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
}

/** Perioder barnet bor i samme husstand som aktuell forelder */
export interface BorISammeHusstandDto {
    /**
     * Barnet bor i husstanden fra- og med måned
     * @format date
     */
    periodeFra?: string;
    /**
     * Barnet bor i husstanden til- og med måned
     * @format date
     */
    periodeTil?: string;
    /** Manuelt opprettet av */
    opprettetAv?: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
}

/** Liste over en persons barn og hvilke perioder de eventuelt deler husstand med personen grunnlaget er hentet inn for */
export interface EgneBarnDto {
    /** Id til forelderen. Kan være null ved manuelle registreringer */
    personIdForelder?: string;
    /** Identen til barnet */
    personIdBarn?: string;
    /** Navn på barnet, format <Fornavn, mellomnavn, Etternavn */
    navn?: string;
    /**
     * Barnets fødselsdato
     * @format date
     */
    foedselsdato?: string;
    /**
     * Barnets fødselsår
     * @format int32
     */
    foedselsaar?: number;
    /**
     * Barnets eventuelle dødsdato
     * @format date
     */
    doedsdato?: string;
    /** Manuelt opprettet av */
    opprettetAv?: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
    /** Perioder barnet bor i samme husstand som aktuell forelder */
    borISammeHusstandDtoListe?: BorISammeHusstandDto[];
}

export interface HentGrunnlagspakkeDto {
    /**
     * grunnlagspakke-id
     * @format int32
     */
    grunnlagspakkeId: number;
    /** Periodisert liste over innhentede inntekter fra a-inntekt og underliggende poster */
    ainntektListe: AinntektDto[];
    /** Periodisert liste over innhentede fra skatt og underliggende poster */
    skattegrunnlagListe: SkattegrunnlagDto[];
    /** Periodisert liste over innhentet utvidet barnetrygd og småbarnstillegg */
    ubstListe: UtvidetBarnetrygdOgSmaabarnstilleggDto[];
    /** Periodisert liste over innhentet barnetillegg */
    barnetilleggListe: BarnetilleggDto[];
    /** Periodisert liste over innhentet kontantstøtte */
    kontantstotteListe: KontantstotteDto[];
    /** Liste over en persons barn og hvilke perioder de eventuelt deler husstand med personen grunnlaget er hentet inn for */
    egneBarnListe: EgneBarnDto[];
    /** Periodisert liste over innhentede husstander for en person og dens voksne husstandsmedlemmer */
    husstandListe: HusstandDto[];
    /** Periodisert liste over en persons sivilstand */
    sivilstandListe: SivilstandDto[];
    /** Periodisert liste over innhentet barnetilsyn */
    barnetilsynListe: BarnetilsynDto[];
}

/** Periodisert liste over innhentede husstander for en person og dens voksne husstandsmedlemmer */
export interface HusstandDto {
    /** Id til personen husstandsinformasjonen er rapportert for */
    personId?: string;
    /**
     * Personen (BP) bor i husstanden fra- og med måned
     * @format date
     */
    periodeFra: string;
    /**
     * Personen (BP) bor i husstanden til- og med måned
     * @format date
     */
    periodeTil?: string;
    /** Navnet på en gate e.l. */
    adressenavn?: string;
    /** Nummeret som identifiserer et av flere hus i en gate */
    husnummer?: string;
    /** Bokstav som identifiserer del av et bygg */
    husbokstav?: string;
    /** En bokstav og fire siffer som identifiserer en boligenhet innenfor et bygg eller en bygningsdel */
    bruksenhetsnummer?: string;
    /** Norsk postnummer */
    postnummer?: string;
    /** 6 siffer, identifiserer bydel */
    bydelsnummer?: string;
    /** Siffer som identifiserer hvilken kommune adressen ligger i */
    kommunenummer?: string;
    /**
     * Nøkkel til geografisk adresse registrert i Kartverkets matrikkel
     * @format int64
     */
    matrikkelId?: number;
    /** Landkode, skal bare brukes for manuelt registrerte utlandsadresser */
    landkode?: string;
    /** Manuelt opprettet av */
    opprettetAv?: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
    /** Periodisert liste over husstandsmedlemmer */
    husstandsmedlemmerListe?: HusstandsmedlemDto[];
}

/** Periodisert liste over husstandsmedlemmer */
export interface HusstandsmedlemDto {
    /**
     * Husstandsmedlemmet bor i husstanden fra- og med måned
     * @format date
     */
    periodeFra?: string;
    /**
     * Husstandsmedlemmet bor i husstanden til- og med måned
     * @format date
     */
    periodeTil?: string;
    /** Identen til husstandsmedlemmet */
    personId?: string;
    /** Navn på husstandsmedlemmet, format <Fornavn, mellomnavn, Etternavn */
    navn?: string;
    /**
     * Husstandsmedlemmets fødselsdag
     * @format date
     */
    foedselsdato?: string;
    /**
     * Husstandsmedlemmets eventuelle dødsdato
     * @format date
     */
    doedsdato?: string;
    /** Manuelt opprettet av */
    opprettetAv?: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
}

/** Periodisert liste over innhentet kontantstøtte */
export interface KontantstotteDto {
    /** Id til personen som mottar kontatstøtten */
    partPersonId: string;
    /** Id til barnet kontatstøtten er for */
    barnPersonId: string;
    /**
     * Periode fra-dato
     * @format date
     */
    periodeFra: string;
    /**
     * Periode til-dato
     * @format date
     */
    periodeTil?: string;
    /** Angir om en inntektsopplysning er aktiv */
    aktiv: boolean;
    /**
     * Tidspunkt inntekten tas i bruk
     * @format date-time
     */
    brukFra: string;
    /**
     * Tidspunkt inntekten ikke lenger aktiv. Null betyr at inntekten er aktiv
     * @format date-time
     */
    brukTil?: string;
    /**
     * Beløpet kontantstøtten er på
     * @format int32
     */
    belop: number;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
}

/** Periodisert liste over en persons sivilstand */
export interface SivilstandDto {
    /** Id til personen sivilstanden er rapportert for */
    personId?: string;
    /**
     * Sivilstand gjelder fra- og med måned
     * @format date
     */
    periodeFra?: string;
    /**
     * Sivilstand gjelder til- og med måned
     * @format date
     */
    periodeTil?: string;
    /** Personens sivilstand */
    sivilstand: "GIFT" | "ENSLIG" | "SAMBOER";
    /** Manuelt opprettet av */
    opprettetAv?: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
}

/** Periodisert liste over innhentede fra skatt og underliggende poster */
export interface SkattegrunnlagDto {
    /** Id til personen inntekten er rapportert for */
    personId: string;
    /**
     * Periode fra
     * @format date
     */
    periodeFra: string;
    /**
     * Periode frem til
     * @format date
     */
    periodeTil: string;
    /** Angir om en inntektsopplysning er aktiv */
    aktiv: boolean;
    /**
     * Tidspunkt inntekten taes i bruk
     * @format date-time
     */
    brukFra: string;
    /**
     * Tidspunkt inntekten ikke lenger er aktiv. Null betyr at inntekten er aktiv
     * @format date-time
     */
    brukTil?: string;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
    /** Liste over poster med skattegrunnlag */
    skattegrunnlagListe: SkattegrunnlagspostDto[];
}

/** Liste over poster med skattegrunnlag */
export interface SkattegrunnlagspostDto {
    /** Type skattegrunnlag, ordinær eller Svalbard */
    skattegrunnlagType: string;
    /** Type inntekt, Lonnsinntekt, Naeringsinntekt, Pensjon eller trygd, Ytelse fra offentlig */
    inntektType: string;
    /** Belop */
    belop: number;
}

/** Periodisert liste over innhentet utvidet barnetrygd og småbarnstillegg */
export interface UtvidetBarnetrygdOgSmaabarnstilleggDto {
    /** Id til personen ubst er rapportert for */
    personId: string;
    /** Type stønad, utvidet barnetrygd eller småbarnstillegg */
    type: string;
    /**
     * Periode fra- og med måned
     * @format date
     */
    periodeFra: string;
    /**
     * Periode til- og med måned
     * @format date
     */
    periodeTil?: string;
    /** Angir om en stønad er aktiv */
    aktiv: boolean;
    /**
     * Tidspunkt stønaden taes i bruk
     * @format date-time
     */
    brukFra: string;
    /**
     * Tidspunkt stønaden ikke lenger er aktiv. Null betyr at stønaden er aktiv
     * @format date-time
     */
    brukTil?: string;
    /** Beløp */
    belop: number;
    /** Angir om stønaden er manuelt beregnet */
    manueltBeregnet: boolean;
    /**
     * Hentet tidspunkt
     * @format date-time
     */
    hentetTidspunkt: string;
}
