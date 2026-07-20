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

export enum BehandlingsrefKilde {
  BEHANDLING_ID = "BEHANDLING_ID",
  BISYSSOKNAD = "BISYS_SØKNAD",
  BISYSKLAGEREFSOKNAD = "BISYS_KLAGE_REF_SØKNAD",
  ALDERSJUSTERING_BIDRAG = "ALDERSJUSTERING_BIDRAG",
  ALDERSJUSTERING_FORSKUDD = "ALDERSJUSTERING_FORSKUDD",
  REVURDERING_FORSKUDD = "REVURDERING_FORSKUDD",
}

export enum Beslutningstype {
  AVVIST = "AVVIST",
  STADFESTELSE = "STADFESTELSE",
  ENDRING = "ENDRING",
  DELVEDTAK = "DELVEDTAK",
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

export enum Grunnlagstype {
  UKJENT = "UKJENT",
  INNTEKT_SKATTELEMENT = "INNTEKT_SKATTELEMENT",
  SAeRFRADRAG = "SÆRFRADRAG",
  SKATTEKLASSE = "SKATTEKLASSE",
  SAMVAeRSKLASSE = "SAMVÆRSKLASSE",
  BIDRAGSEVNE = "BIDRAGSEVNE",
  LOPENDEBIDRAG = "LØPENDE_BIDRAG",
  LOPENDEBIDRAGPERIODE = "LØPENDE_BIDRAG_PERIODE",
  FAKTISK_UTGIFT_PERIODE = "FAKTISK_UTGIFT_PERIODE",
  TILLEGGSSTONADPERIODE = "TILLEGGSSTØNAD_PERIODE",
  BARNETILSYNMEDSTONADPERIODE = "BARNETILSYN_MED_STØNAD_PERIODE",
  FORPLEINING_UTGIFT = "FORPLEINING_UTGIFT",
  NETTO_BARNETILSYN = "NETTO_BARNETILSYN",
  UNDERHOLDSKOSTNAD = "UNDERHOLDSKOSTNAD",
  BPS_ANDEL_UNDERHOLDSKOSTNAD = "BPS_ANDEL_UNDERHOLDSKOSTNAD",
  TILLEGGSBIDRAG = "TILLEGGSBIDRAG",
  MAKS_BIDRAG_PER_BARN = "MAKS_BIDRAG_PER_BARN",
  MAKSGRENSE25INNTEKT = "MAKS_GRENSE_25_INNTEKT",
  GEBYRFRITAK = "GEBYRFRITAK",
  INNBETALTBELOP = "INNBETALT_BELØP",
  FORHOLDSMESSIG_FORDELING = "FORHOLDSMESSIG_FORDELING",
  KLAGE_STATISTIKK = "KLAGE_STATISTIKK",
  NETTO_TILSYNSUTGIFT = "NETTO_TILSYNSUTGIFT",
  SAMVAeRSPERIODE = "SAMVÆRSPERIODE",
  SAMVAeRSKALKULATOR = "SAMVÆRSKALKULATOR",
  DELBEREGNINGSAMVAeRSKLASSE = "DELBEREGNING_SAMVÆRSKLASSE",
  DELBEREGNINGSAMVAeRSKLASSENETTER = "DELBEREGNING_SAMVÆRSKLASSE_NETTER",
  SJABLON_SJABLONTALL = "SJABLON_SJABLONTALL",
  SJABLON_BIDRAGSEVNE = "SJABLON_BIDRAGSEVNE",
  SJABLON_TRINNVIS_SKATTESATS = "SJABLON_TRINNVIS_SKATTESATS",
  SJABLON_BARNETILSYN = "SJABLON_BARNETILSYN",
  SJABLON_FORBRUKSUTGIFTER = "SJABLON_FORBRUKSUTGIFTER",
  SJABLON_SAMVARSFRADRAG = "SJABLON_SAMVARSFRADRAG",
  SJABLON_MAKS_FRADRAG = "SJABLON_MAKS_FRADRAG",
  SJABLON_MAKS_TILSYN = "SJABLON_MAKS_TILSYN",
  SJABLON_INDEKSREGULERING_FAKTOR = "SJABLON_INDEKSREGULERING_FAKTOR",
  BOSTATUS_PERIODE = "BOSTATUS_PERIODE",
  SIVILSTAND_PERIODE = "SIVILSTAND_PERIODE",
  INNTEKT_RAPPORTERING_PERIODE = "INNTEKT_RAPPORTERING_PERIODE",
  SOKNAD = "SØKNAD",
  BEHANDLING_DETALJER = "BEHANDLING_DETALJER",
  VIRKNINGSTIDSPUNKT = "VIRKNINGSTIDSPUNKT",
  NOTAT = "NOTAT",
  SAK_DETALJER = "SAK_DETALJER",
  PRIVAT_AVTALE_GRUNNLAG = "PRIVAT_AVTALE_GRUNNLAG",
  PRIVAT_AVTALE_PERIODE_GRUNNLAG = "PRIVAT_AVTALE_PERIODE_GRUNNLAG",
  SAeRBIDRAGKATEGORI = "SÆRBIDRAG_KATEGORI",
  UTGIFT_DIREKTE_BETALT = "UTGIFT_DIREKTE_BETALT",
  UTGIFTMAKSGODKJENTBELOP = "UTGIFT_MAKS_GODKJENT_BELØP",
  UTGIFTSPOSTER = "UTGIFTSPOSTER",
  SLUTTBEREGNING_FORSKUDD = "SLUTTBEREGNING_FORSKUDD",
  DELBEREGNING_SUM_INNTEKT = "DELBEREGNING_SUM_INNTEKT",
  DELBEREGNING_BARN_I_HUSSTAND = "DELBEREGNING_BARN_I_HUSSTAND",
  SLUTTBEREGNINGSAeRBIDRAG = "SLUTTBEREGNING_SÆRBIDRAG",
  DELBEREGNING_BIDRAGSEVNE = "DELBEREGNING_BIDRAGSEVNE",
  DELBEREGNING_BIDRAGSPLIKTIGES_BEREGNEDE_TOTALBIDRAG = "DELBEREGNING_BIDRAGSPLIKTIGES_BEREGNEDE_TOTALBIDRAG",
  DELBEREGNING_VOKSNE_I_HUSSTAND = "DELBEREGNING_VOKSNE_I_HUSSTAND",
  DELBEREGNING_FAKTISK_UTGIFT = "DELBEREGNING_FAKTISK_UTGIFT",
  DELBEREGNINGTILLEGGSSTONAD = "DELBEREGNING_TILLEGGSSTØNAD",
  DELBEREGNING_BOFORHOLD = "DELBEREGNING_BOFORHOLD",
  DELBEREGNINGBIDRAGSPLIKTIGESANDELSAeRBIDRAG = "DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL_SÆRBIDRAG",
  DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL = "DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL",
  DELBEREGNING_UTGIFT = "DELBEREGNING_UTGIFT",
  DELBEREGNINGSAMVAeRSFRADRAG = "DELBEREGNING_SAMVÆRSFRADRAG",
  DELBEREGNING_NETTO_TILSYNSUTGIFT = "DELBEREGNING_NETTO_TILSYNSUTGIFT",
  DELBEREGNING_BARNETILLEGG_SKATTESATS = "DELBEREGNING_BARNETILLEGG_SKATTESATS",
  DELBEREGNING_NETTO_BARNETILLEGG = "DELBEREGNING_NETTO_BARNETILLEGG",
  DELBEREGNING_UNDERHOLDSKOSTNAD = "DELBEREGNING_UNDERHOLDSKOSTNAD",
  DELBEREGNING_ENDRING_SJEKK_GRENSE_PERIODE = "DELBEREGNING_ENDRING_SJEKK_GRENSE_PERIODE",
  DELBEREGNING_ENDRING_SJEKK_GRENSE = "DELBEREGNING_ENDRING_SJEKK_GRENSE",
  DELBEREGNING_PRIVAT_AVTALE_PERIODE = "DELBEREGNING_PRIVAT_AVTALE_PERIODE",
  DELBEREGNING_PRIVAT_AVTALE = "DELBEREGNING_PRIVAT_AVTALE",
  DELBEREGNING_INDEKSREGULERING_PRIVAT_AVTALE = "DELBEREGNING_INDEKSREGULERING_PRIVAT_AVTALE",
  DELBEREGNING_INDEKSREGULERING_PERIODE = "DELBEREGNING_INDEKSREGULERING_PERIODE",
  SLUTTBEREGNING_BARNEBIDRAG = "SLUTTBEREGNING_BARNEBIDRAG",
  SLUTTBEREGNING_BARNEBIDRAG_ALDERSJUSTERING = "SLUTTBEREGNING_BARNEBIDRAG_ALDERSJUSTERING",
  SLUTTBEREGNING_FORHOLDSMESSIG_FORDELING = "SLUTTBEREGNING_FORHOLDSMESSIG_FORDELING",
  SLUTTBEREGNING_INDEKSREGULERING = "SLUTTBEREGNING_INDEKSREGULERING",
  BARNETILLEGG_PERIODE = "BARNETILLEGG_PERIODE",
  BELOPSHISTORIKKBIDRAG = "BELØPSHISTORIKK_BIDRAG",
  BELOPSHISTORIKKBIDRAG18AR = "BELØPSHISTORIKK_BIDRAG_18_ÅR",
  BELOPSHISTORIKKFORSKUDD = "BELØPSHISTORIKK_FORSKUDD",
  MANUELLE_VEDTAK = "MANUELLE_VEDTAK",
  MANUELT_OVERSTYRT_GEBYR = "MANUELT_OVERSTYRT_GEBYR",
  DELBEREGNING_INNTEKTSBASERT_GEBYR = "DELBEREGNING_INNTEKTSBASERT_GEBYR",
  SLUTTBEREGNING_GEBYR = "SLUTTBEREGNING_GEBYR",
  PERSON = "PERSON",
  PERSON_BIDRAGSMOTTAKER = "PERSON_BIDRAGSMOTTAKER",
  PERSON_BIDRAGSPLIKTIG = "PERSON_BIDRAGSPLIKTIG",
  PERSON_REELL_MOTTAKER = "PERSON_REELL_MOTTAKER",
  PERSONSOKNADSBARN = "PERSON_SØKNADSBARN",
  PERSON_HUSSTANDSMEDLEM = "PERSON_HUSSTANDSMEDLEM",
  PERSON_BARN_BIDRAGSPLIKTIG = "PERSON_BARN_BIDRAGSPLIKTIG",
  PERSON_BARN_BIDRAGSMOTTAKER = "PERSON_BARN_BIDRAGSMOTTAKER",
  BEREGNET_INNTEKT = "BEREGNET_INNTEKT",
  INNHENTET_HUSSTANDSMEDLEM = "INNHENTET_HUSSTANDSMEDLEM",
  INNHENTET_ANDRE_VOKSNE_I_HUSSTANDEN = "INNHENTET_ANDRE_VOKSNE_I_HUSSTANDEN",
  INNHENTET_SIVILSTAND = "INNHENTET_SIVILSTAND",
  INNHENTET_ARBEIDSFORHOLD = "INNHENTET_ARBEIDSFORHOLD",
  INNHENTETTILLEGGSSTONAD = "INNHENTET_TILLEGGSSTØNAD",
  INNHENTETTILLEGGSSTONADBEGRENSET = "INNHENTET_TILLEGGSSTØNAD_BEGRENSET",
  INNHENTET_BARNETILSYN = "INNHENTET_BARNETILSYN",
  INNHENTET_ANDRE_BARN_TIL_BIDRAGSMOTTAKER = "INNHENTET_ANDRE_BARN_TIL_BIDRAGSMOTTAKER",
  INNHENTET_INNTEKT_SKATTEGRUNNLAG_PERIODE = "INNHENTET_INNTEKT_SKATTEGRUNNLAG_PERIODE",
  INNHENTET_INNTEKT_AORDNING = "INNHENTET_INNTEKT_AORDNING",
  INNHENTET_INNTEKT_BARNETILLEGG = "INNHENTET_INNTEKT_BARNETILLEGG",
  INNHENTETINNTEKTKONTANTSTOTTE = "INNHENTET_INNTEKT_KONTANTSTØTTE",
  INNHENTET_INNTEKT_AINNTEKT = "INNHENTET_INNTEKT_AINNTEKT",
  INNHENTETINNTEKTSMABARNSTILLEGG = "INNHENTET_INNTEKT_SMÅBARNSTILLEGG",
  INNHENTET_INNTEKT_UTVIDETBARNETRYGD = "INNHENTET_INNTEKT_UTVIDETBARNETRYGD",
  UNNTAK = "UNNTAK",
  KOPI_DELBEREGNING_UNDERHOLDSKOSTNAD = "KOPI_DELBEREGNING_UNDERHOLDSKOSTNAD",
  KOPI_DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL = "KOPI_DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL",
  KOPIBARNETILSYNMEDSTONADPERIODE = "KOPI_BARNETILSYN_MED_STØNAD_PERIODE",
  KOPISAMVAeRSPERIODE = "KOPI_SAMVÆRSPERIODE",
  ALDERSJUSTERING_DETALJER = "ALDERSJUSTERING_DETALJER",
  RESULTAT_FRA_VEDTAK = "RESULTAT_FRA_VEDTAK",
  VEDTAK_ORKESTRERING_DETALJER = "VEDTAK_ORKESTRERING_DETALJER",
  ETTERFOLGENDEMANUELLEVEDTAK = "ETTERFØLGENDE_MANUELLE_VEDTAK",
  DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL_DELT_BOSTED = "DELBEREGNING_BIDRAGSPLIKTIGES_ANDEL_DELT_BOSTED",
  DELBEREGNING_BIDRAG_TIL_FORDELING = "DELBEREGNING_BIDRAG_TIL_FORDELING",
  DELBEREGNING_SUM_BIDRAG_TIL_FORDELING = "DELBEREGNING_SUM_BIDRAG_TIL_FORDELING",
  DELBEREGNINGEVNE25PROSENTAVINNTEKT = "DELBEREGNING_EVNE_25PROSENTAVINNTEKT",
  DELBEREGNING_ANDEL_AV_BIDRAGSEVNE = "DELBEREGNING_ANDEL_AV_BIDRAGSEVNE",
  DELBEREGNING_BIDRAG_JUSTERT_FOR_BP_BARNETILLEGG = "DELBEREGNING_BIDRAG_JUSTERT_FOR_BP_BARNETILLEGG",
  DELBEREGNINGBIDRAGTILFORDELINGLOPENDEBIDRAG = "DELBEREGNING_BIDRAG_TIL_FORDELING_LØPENDE_BIDRAG",
  DELBEREGNING_BIDRAG_TIL_FORDELING_PRIVAT_AVTALE = "DELBEREGNING_BIDRAG_TIL_FORDELING_PRIVAT_AVTALE",
  VALUTAKURS_GRUNNLAG = "VALUTAKURS_GRUNNLAG",
}

export enum Innkrevingstype {
  MED_INNKREVING = "MED_INNKREVING",
  UTEN_INNKREVING = "UTEN_INNKREVING",
}

export interface OpprettBehandlingsreferanseRequestDto {
  /** Kilde/type for en behandlingsreferanse */
  kilde: BehandlingsrefKilde;
  /** Kildesystemets referanse til behandlingen */
  referanse: string;
}

export interface OpprettEngangsbelopRequestDto {
  /** Beløpstype. Særbidrag, gebyr m.m. */
  type: Engangsbeloptype;
  /** Referanse til sak */
  sak: string;
  /** Personidenten til den som skal betale engangsbeløpet */
  skyldner: string;
  /** Personidenten til den som krever engangsbeløpet */
  kravhaver: string;
  /** Personidenten til den som mottar engangsbeløpet */
  mottaker: string;
  /** Beregnet engangsbeløp */
  beløp?: number | null;
  /** Valutakoden tilhørende engangsbeløpet */
  valutakode?: string | null;
  /** Resultatkoden tilhørende engangsbeløpet */
  resultatkode: string;
  /** Angir om engangsbeløpet skal innkreves */
  innkreving: Innkrevingstype;
  /** Angir om søknaden om engangsbeløp er besluttet avvist, stadfestet eller skal medføre endringGyldige verdier er 'AVVIST', 'STADFESTELSE' og 'ENDRING' */
  beslutning: Beslutningstype;
  /**
   * Id for vedtaket det er klaget på. Utgjør sammen med referanse en unik id for et engangsbeløp
   * @format int32
   */
  omgjørVedtakId?: number | null;
  /** Referanse til engangsbeløp, brukes for å kunne omgjøre engangsbeløp senere i et klagevedtak. Unik innenfor et vedtak. Unik referanse blir generert av bidrag-vedtak hvis den ikke er angitt i requesten. */
  referanse?: string | null;
  /** Referanse - delytelsesId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
  delytelseId?: string | null;
  /** Referanse som brukes i utlandssaker */
  eksternReferanse?: string | null;
  /** Liste over alle grunnlag som inngår i engangsbeløpet */
  grunnlagReferanseListe: string[];
  /** Beløp BP allerede har betalt. Kan være 0 eller høyere. */
  betaltBeløp?: number | null;
}

export interface OpprettGrunnlagRequestDto {
  /** Referanse (unikt navn på grunnlaget) */
  referanse: string;
  /** Grunnlagstype */
  type: Grunnlagstype;
  /** Grunnlagsinnhold (generisk) */
  innhold: string;
  /** Liste over grunnlagsreferanser */
  grunnlagsreferanseListe: string[];
  /** Referanse til personobjektet grunnlaget gjelder */
  gjelderReferanse?: string | null;
  /** Referanse til barn personobjektet grunnlaget gjelder */
  gjelderBarnReferanse?: string | null;
}

export interface OpprettPeriodeRequestDto {
  /** Periode med fra-og-med-dato og til-dato med format ÅÅÅÅ-MM */
  periode: TypeArManedsperiode;
  /** Beregnet stønadsbeløp */
  beløp?: number | null;
  /** Valutakoden tilhørende stønadsbeløpet */
  valutakode?: string | null;
  /** Resultatkoden tilhørende stønadsbeløpet */
  resultatkode: string;
  /** Referanse - delytelseId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
  delytelseId?: string | null;
  /** Liste over alle grunnlag som inngår i perioden */
  grunnlagReferanseListe: string[];
}

export interface OpprettStonadsendringRequestDto {
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
   * Vedtaksid for siste vedtak. Ikke utfyllt for førstegangsvedtak
   * @format int32
   */
  sisteVedtaksid?: number | null;
  /**
   * Angir første år en stønad skal indeksreguleres
   * @format int32
   */
  førsteIndeksreguleringsår?: number | null;
  /** Angir om stønaden skal innkreves */
  innkreving: Innkrevingstype;
  /** Angir om søknaden om stønadsendring er besluttet avvist, stadfestet eller skal medføre endringGyldige verdier er 'AVVIST', 'STADFESTELSE' og 'ENDRING' */
  beslutning: Beslutningstype;
  /**
   * Id for vedtaket det er klaget på
   * @format int32
   */
  omgjørVedtakId?: number | null;
  /** Referanse som brukes i utlandssaker */
  eksternReferanse?: string | null;
  /** Liste over grunnlag som er knyttet direkte til stønadsendringen */
  grunnlagReferanseListe: string[];
  /** Liste over alle perioder som inngår i stønadsendringen */
  periodeListe: OpprettPeriodeRequestDto[];
}

export interface OpprettVedtakRequestDto {
  /** Hva er kilden til vedtaket. Automatisk eller manuelt */
  kilde: "MANUELT" | "AUTOMATISK";
  /** Type vedtak */
  type: Vedtakstype;
  /** Skal bare brukes ved batchkjøring. Id til batchjobb som oppretter vedtaket */
  opprettetAv?: string | null;
  /**
   * Tidspunkt/timestamp når vedtaket er fattet. Er null for vedtaksforslag
   * @format date-time
   */
  vedtakstidspunkt?: string | null;
  /** Referanse som er unik for vedtaket */
  unikReferanse?: string | null;
  /** Enheten som er ansvarlig for vedtaket. Kan være null for feks batch */
  enhetsnummer?: string | null;
  /**
   * Settes hvis overføring til Elin skal utsettes
   * @format date
   */
  innkrevingUtsattTilDato?: string | null;
  /** Settes hvis vedtaket er fastsatt i utlandet */
  fastsattILand?: string | null;
  /** Liste over alle grunnlag som inngår i vedtaket */
  grunnlagListe: OpprettGrunnlagRequestDto[];
  /** Liste over alle stønadsendringer som inngår i vedtaket */
  stønadsendringListe: OpprettStonadsendringRequestDto[];
  /** Liste over alle engangsbeløp som inngår i vedtaket */
  engangsbeløpListe: OpprettEngangsbelopRequestDto[];
  /** Liste med referanser til alle behandlinger som ligger som grunnlag til vedtaket */
  behandlingsreferanseListe: OpprettBehandlingsreferanseRequestDto[];
}

export enum Stonadstype {
  BIDRAG = "BIDRAG",
  FORSKUDD = "FORSKUDD",
  BIDRAG18AAR = "BIDRAG18AAR",
  EKTEFELLEBIDRAG = "EKTEFELLEBIDRAG",
  MOTREGNING = "MOTREGNING",
  OPPFOSTRINGSBIDRAG = "OPPFOSTRINGSBIDRAG",
}

export enum Vedtakstype {
  INDEKSREGULERING = "INDEKSREGULERING",
  ALDERSJUSTERING = "ALDERSJUSTERING",
  OPPHOR = "OPPHØR",
  ALDERSOPPHOR = "ALDERSOPPHØR",
  REVURDERING = "REVURDERING",
  FASTSETTELSE = "FASTSETTELSE",
  INNKREVING = "INNKREVING",
  KLAGE = "KLAGE",
  ENDRING = "ENDRING",
  ENDRING_MOTTAKER = "ENDRING_MOTTAKER",
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

export interface ConflictException {
  message?: string | null;
  body?: any;
  cause?: {
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    suppressed?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      localizedMessage?: string;
    }[];
    localizedMessage?: string;
  };
  stackTrace?: {
    classLoaderName?: string;
    moduleName?: string;
    moduleVersion?: string;
    methodName?: string;
    fileName?: string;
    /** @format int32 */
    lineNumber?: number;
    className?: string;
    nativeMethod?: boolean;
  }[];
  statusCode?: DefaultHttpStatusCode | HttpStatus;
  statusText?: string;
  responseHeaders?: HttpHeaders;
  responseBodyAsString?: string;
  /** @format byte */
  responseBodyAsByteArray?: string;
  bodyConvertFunction?: any;
  rootCause?: {
    cause?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      suppressed?: {
        stackTrace?: {
          classLoaderName?: string;
          moduleName?: string;
          moduleVersion?: string;
          methodName?: string;
          fileName?: string;
          /** @format int32 */
          lineNumber?: number;
          className?: string;
          nativeMethod?: boolean;
        }[];
        message?: string;
        localizedMessage?: string;
      }[];
      localizedMessage?: string;
    };
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    suppressed?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      localizedMessage?: string;
    }[];
    localizedMessage?: string;
  };
  mostSpecificCause?: {
    cause?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      suppressed?: {
        stackTrace?: {
          classLoaderName?: string;
          moduleName?: string;
          moduleVersion?: string;
          methodName?: string;
          fileName?: string;
          /** @format int32 */
          lineNumber?: number;
          className?: string;
          nativeMethod?: boolean;
        }[];
        message?: string;
        localizedMessage?: string;
      }[];
      localizedMessage?: string;
    };
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    suppressed?: {
      stackTrace?: {
        classLoaderName?: string;
        moduleName?: string;
        moduleVersion?: string;
        methodName?: string;
        fileName?: string;
        /** @format int32 */
        lineNumber?: number;
        className?: string;
        nativeMethod?: boolean;
      }[];
      message?: string;
      localizedMessage?: string;
    }[];
    localizedMessage?: string;
  };
  suppressed?: {
    stackTrace?: {
      classLoaderName?: string;
      moduleName?: string;
      moduleVersion?: string;
      methodName?: string;
      fileName?: string;
      /** @format int32 */
      lineNumber?: number;
      className?: string;
      nativeMethod?: boolean;
    }[];
    message?: string;
    localizedMessage?: string;
  }[];
  localizedMessage?: string;
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

export type DefaultHttpStatusCode = HttpStatusCode;

export interface HttpHeaders {
  contentDisposition?: ContentDisposition;
  acceptCharset?: string[];
  host?: {
    address?: {
      hostAddress?: string;
      /** @format byte */
      address?: string;
      hostName?: string;
      linkLocalAddress?: boolean;
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
    unresolved?: boolean;
    hostName?: string;
    hostString?: string;
  };
  empty?: boolean;
  /** @format uri */
  location?: string;
  all?: Record<string, string>;
  /** @format int64 */
  lastModified?: number;
  /** @format int64 */
  date?: number;
  /** @format int64 */
  contentLength?: number;
  bearerAuth?: string;
  range?: HttpRange[];
  connection?: string[];
  origin?: string;
  cacheControl?: string;
  /** @uniqueItems true */
  allow?: HttpMethod[];
  contentLanguage?: string;
  etag?: string;
  accessControlAllowOrigin?: string;
  accessControlAllowMethods?: HttpMethod[];
  accessControlAllowHeaders?: string[];
  accessControlExposeHeaders?: string[];
  accessControlAllowCredentials?: boolean;
  /** @format int64 */
  accessControlMaxAge?: number;
  accessControlRequestMethod?: HttpMethod;
  accessControlRequestHeaders?: string[];
  acceptLanguage?: {
    range?: string;
    /** @format double */
    weight?: number;
  }[];
  basicAuth?: string;
  accept?: MediaType[];
  acceptLanguageAsLocales?: string[];
  acceptPatch?: MediaType[];
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

export enum HttpStatus {
  Value100CONTINUE = "100 CONTINUE",
  Value101SWITCHINGPROTOCOLS = "101 SWITCHING_PROTOCOLS",
  Value102PROCESSING = "102 PROCESSING",
  Value103EARLYHINTS = "103 EARLY_HINTS",
  Value200OK = "200 OK",
  Value201CREATED = "201 CREATED",
  Value202ACCEPTED = "202 ACCEPTED",
  Value203NONAUTHORITATIVEINFORMATION = "203 NON_AUTHORITATIVE_INFORMATION",
  Value204NOCONTENT = "204 NO_CONTENT",
  Value205RESETCONTENT = "205 RESET_CONTENT",
  Value206PARTIALCONTENT = "206 PARTIAL_CONTENT",
  Value207MULTISTATUS = "207 MULTI_STATUS",
  Value208ALREADYREPORTED = "208 ALREADY_REPORTED",
  Value226IMUSED = "226 IM_USED",
  Value300MULTIPLECHOICES = "300 MULTIPLE_CHOICES",
  Value301MOVEDPERMANENTLY = "301 MOVED_PERMANENTLY",
  Value302FOUND = "302 FOUND",
  Value303SEEOTHER = "303 SEE_OTHER",
  Value304NOTMODIFIED = "304 NOT_MODIFIED",
  Value307TEMPORARYREDIRECT = "307 TEMPORARY_REDIRECT",
  Value308PERMANENTREDIRECT = "308 PERMANENT_REDIRECT",
  Value400BADREQUEST = "400 BAD_REQUEST",
  Value401UNAUTHORIZED = "401 UNAUTHORIZED",
  Value402PAYMENTREQUIRED = "402 PAYMENT_REQUIRED",
  Value403FORBIDDEN = "403 FORBIDDEN",
  Value404NOTFOUND = "404 NOT_FOUND",
  Value405METHODNOTALLOWED = "405 METHOD_NOT_ALLOWED",
  Value406NOTACCEPTABLE = "406 NOT_ACCEPTABLE",
  Value407PROXYAUTHENTICATIONREQUIRED = "407 PROXY_AUTHENTICATION_REQUIRED",
  Value408REQUESTTIMEOUT = "408 REQUEST_TIMEOUT",
  Value409CONFLICT = "409 CONFLICT",
  Value410GONE = "410 GONE",
  Value411LENGTHREQUIRED = "411 LENGTH_REQUIRED",
  Value412PRECONDITIONFAILED = "412 PRECONDITION_FAILED",
  Value413CONTENTTOOLARGE = "413 CONTENT_TOO_LARGE",
  Value413PAYLOADTOOLARGE = "413 PAYLOAD_TOO_LARGE",
  Value414URITOOLONG = "414 URI_TOO_LONG",
  Value415UNSUPPORTEDMEDIATYPE = "415 UNSUPPORTED_MEDIA_TYPE",
  Value416REQUESTEDRANGENOTSATISFIABLE = "416 REQUESTED_RANGE_NOT_SATISFIABLE",
  Value417EXPECTATIONFAILED = "417 EXPECTATION_FAILED",
  Value418IAMATEAPOT = "418 I_AM_A_TEAPOT",
  Value421MISDIRECTEDREQUEST = "421 MISDIRECTED_REQUEST",
  Value422UNPROCESSABLECONTENT = "422 UNPROCESSABLE_CONTENT",
  Value422UNPROCESSABLEENTITY = "422 UNPROCESSABLE_ENTITY",
  Value423LOCKED = "423 LOCKED",
  Value424FAILEDDEPENDENCY = "424 FAILED_DEPENDENCY",
  Value425TOOEARLY = "425 TOO_EARLY",
  Value426UPGRADEREQUIRED = "426 UPGRADE_REQUIRED",
  Value428PRECONDITIONREQUIRED = "428 PRECONDITION_REQUIRED",
  Value429TOOMANYREQUESTS = "429 TOO_MANY_REQUESTS",
  Value431REQUESTHEADERFIELDSTOOLARGE = "431 REQUEST_HEADER_FIELDS_TOO_LARGE",
  Value451UNAVAILABLEFORLEGALREASONS = "451 UNAVAILABLE_FOR_LEGAL_REASONS",
  Value500INTERNALSERVERERROR = "500 INTERNAL_SERVER_ERROR",
  Value501NOTIMPLEMENTED = "501 NOT_IMPLEMENTED",
  Value502BADGATEWAY = "502 BAD_GATEWAY",
  Value503SERVICEUNAVAILABLE = "503 SERVICE_UNAVAILABLE",
  Value504GATEWAYTIMEOUT = "504 GATEWAY_TIMEOUT",
  Value505HTTPVERSIONNOTSUPPORTED = "505 HTTP_VERSION_NOT_SUPPORTED",
  Value506VARIANTALSONEGOTIATES = "506 VARIANT_ALSO_NEGOTIATES",
  Value507INSUFFICIENTSTORAGE = "507 INSUFFICIENT_STORAGE",
  Value508LOOPDETECTED = "508 LOOP_DETECTED",
  Value509BANDWIDTHLIMITEXCEEDED = "509 BANDWIDTH_LIMIT_EXCEEDED",
  Value510NOTEXTENDED = "510 NOT_EXTENDED",
  Value511NETWORKAUTHENTICATIONREQUIRED = "511 NETWORK_AUTHENTICATION_REQUIRED",
}

export interface HttpStatusCode {
  error?: boolean;
  is2xxSuccessful?: boolean;
  is1xxInformational?: boolean;
  is3xxRedirection?: boolean;
  is4xxClientError?: boolean;
  is5xxServerError?: boolean;
}

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

export interface BehandlingsreferanseDto {
  /** Kilde/type for en behandlingsreferanse */
  kilde: BehandlingsrefKilde;
  /** Kildesystemets referanse til behandlingen */
  referanse: string;
}

export interface EngangsbelopDto {
  /** Type Engangsbeløp. Særbidrag, gebyr m.m. */
  type: Engangsbeloptype;
  /** Referanse til sak */
  sak: string;
  /** Personidenten til den som skal betale engangsbeløpet */
  skyldner: string;
  /** Personidenten til den som krever engangsbeløpet */
  kravhaver: string;
  /** Personidenten til den som mottar engangsbeløpet */
  mottaker: string;
  /** Beregnet engangsbeløp */
  beløp?: number | null;
  /** Valutakoden tilhørende engangsbeløpet */
  valutakode?: string | null;
  /** Resultatkoden tilhørende engangsbeløpet */
  resultatkode: string;
  /** Angir om engangsbeløpet skal innkreves */
  innkreving: Innkrevingstype;
  /** Angir om søknaden om engangsbeløp er besluttet avvist, stadfestet eller skal medføre endringGyldige verdier er 'AVVIST', 'STADFESTELSE' og 'ENDRING' */
  beslutning: Beslutningstype;
  /**
   * Id for vedtaket det er klaget på. Utgjør sammen med referanse en unik id for et engangsbeløp
   * @format int32
   */
  omgjørVedtakId?: number | null;
  /** Referanse til engangsbeløp, brukes for å kunne omgjøre engangsbeløp senere i et klagevedtak. Unik innenfor et vedtak.Referansen er enten angitt i requesten for opprettelse av vedtak eller generert av bidrag-vedtak hvis den ikke var angitt i requesten. */
  referanse: string;
  /** Referanse - delytelsesId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
  delytelseId?: string | null;
  /** Referanse som brukes i utlandssaker */
  eksternReferanse?: string | null;
  /** Liste over alle grunnlag som inngår i beregningen */
  grunnlagReferanseListe: string[];
  /** Beløp BP allerede har betalt. Kan være 0 eller høyere. */
  betaltBeløp?: number | null;
}

/** Grunnlag */
export interface GrunnlagDto {
  /** Referanse (unikt navn på grunnlaget) */
  referanse: string;
  /** Grunnlagstype */
  type: Grunnlagstype;
  /** Grunnlagsinnhold (generisk) */
  innhold: string;
  /** Liste over grunnlagsreferanser */
  grunnlagsreferanseListe: string[];
  /** Referanse til personobjektet grunnlaget gjelder */
  gjelderReferanse?: string | null;
  /** Referanse til barn personobjektet grunnlaget gjelder */
  gjelderBarnReferanse?: string | null;
}

export interface StonadsendringDto {
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
   * Vedtaksid for siste vedtak. Ikke utfyllt for førstegangsvedtak
   * @format int32
   */
  sisteVedtaksid?: number | null;
  /**
   * Angir første år en stønad skal indeksreguleres
   * @format int32
   */
  førsteIndeksreguleringsår?: number | null;
  /** Angir om stønaden skal innkreves */
  innkreving: Innkrevingstype;
  /** Angir om søknaden om engangsbeløp er besluttet avvist, stadfestet eller skal medføre endringGyldige verdier er 'AVVIST', 'STADFESTELSE' og 'ENDRING' */
  beslutning: Beslutningstype;
  /**
   * Id for vedtaket det er klaget på
   * @format int32
   */
  omgjørVedtakId?: number | null;
  /** Referanse som brukes i utlandssaker */
  eksternReferanse?: string | null;
  /** Liste over grunnlag som er knyttet direkte til stønadsendringen */
  grunnlagReferanseListe: string[];
  /** Liste over alle perioder som inngår i stønadsendringen */
  periodeListe: VedtakPeriodeDto[];
}

export interface VedtakDto {
  /** @format int32 */
  vedtaksid: number;
  /** Hva er kilden til vedtaket. Automatisk eller manuelt */
  kilde: "MANUELT" | "AUTOMATISK";
  /** Type vedtak */
  type: Vedtakstype;
  /** Id til saksbehandler eller batchjobb som opprettet vedtaket. For saksbehandler er ident hentet fra token */
  opprettetAv: string;
  /** Saksbehandlers navn */
  opprettetAvNavn?: string | null;
  /** Navn på applikasjon som vedtaket er opprettet i. Skal være i lowercase. */
  kildeapplikasjon: string;
  /**
   * Tidspunkt/timestamp når vedtaket er fattet. Er null for vedtaksforslag
   * @format date-time
   */
  vedtakstidspunkt?: string | null;
  /** Referanse som er unik for vedtaket */
  unikReferanse?: string | null;
  /** Enheten som er ansvarlig for vedtaket. Kan være null for feks batch */
  enhetsnummer?: string | null;
  /**
   * Settes hvis overføring til Elin skal utsettes
   * @format date
   */
  innkrevingUtsattTilDato?: string | null;
  /** Settes hvis vedtaket er fastsatt i utlandet */
  fastsattILand?: string | null;
  /**
   * Tidspunkt vedtaket er fattet
   * @format date-time
   */
  opprettetTidspunkt: string;
  /** Liste over alle grunnlag som inngår i vedtaket */
  grunnlagListe: GrunnlagDto[];
  /** Liste over alle stønadsendringer som inngår i vedtaket */
  stønadsendringListe: StonadsendringDto[];
  /** Liste over alle engangsbeløp som inngår i vedtaket */
  engangsbeløpListe: EngangsbelopDto[];
  /** Liste med referanser til alle behandlinger som ligger som grunnlag til vedtaket */
  behandlingsreferanseListe: BehandlingsreferanseDto[];
}

export interface VedtakPeriodeDto {
  /** Periode med fra-og-med-dato og til-dato med format ÅÅÅÅ-MM */
  periode: TypeArManedsperiode;
  /** Beregnet stønadsbeløp */
  beløp?: number | null;
  /** Valutakoden tilhørende stønadsbeløpet */
  valutakode?: string | null;
  /** Resultatkoden tilhørende stønadsbeløpet */
  resultatkode: string;
  /** Referanse - delytelseId/beslutningslinjeId -> bidrag-regnskap. Skal fjernes senere */
  delytelseId?: string | null;
  /** Liste over alle grunnlag som inngår i perioden */
  grunnlagReferanseListe: string[];
}

/** Request for å hente alle endringsvedtak for en stønad (saksnr, stønadstype, skyldner, kravhaver */
export interface HentVedtakForStonadRequest {
  /** Saksnummer */
  sak: string;
  /** Hvilken type stønad det er snakk om */
  type: Stonadstype;
  /** Personen som er skyldner i stønaden */
  skyldner: string;
  /** Personen som er kravhaver i stønaden */
  kravhaver: string;
}

/** Respons med alle endringsvedtak for en stønad (saksnr, stønadstype, skyldner, kravhaver */
export interface HentVedtakForStonadResponse {
  /** Liste med vedtak for stønad */
  vedtakListe: VedtakForStonad[];
}

/** Objekt med relevant informasjon fra vedtak */
export interface VedtakForStonad {
  /**
   * Unik id generert for vedtak
   * @format int32
   */
  vedtaksid: number;
  /**
   * Tidspunkt vedtaket ble fattet
   * @format date-time
   */
  vedtakstidspunkt: string;
  /** Type vedtak */
  type: Vedtakstype;
  /** Hva er kilden til vedtaket. Automatisk eller manuelt */
  kilde: "MANUELT" | "AUTOMATISK";
  /** Stønadsendringen for vedtaket */
  stønadsendring: StonadsendringDto;
  /** Referanser til alle behandlinger som ligger som grunnlag til vedtaket */
  behandlingsreferanser: BehandlingsreferanseDto[];
  /** Navn på applikasjon som vedtaket er opprettet i */
  kildeapplikasjon: string;
}

export interface HentManuelleVedtakRequest {
  /** Bidragspliktiges personident */
  skyldner: string;
}

export interface OpprettVedtakResponseDto {
  /**
   * Unik id generert for vedtak
   * @format int32
   */
  vedtaksid: number;
  /** Liste over alle referansen for engangsbeløp som inngår i vedtaket. Ligger i samme rekkefølge som i requesten */
  engangsbeløpReferanseListe: string[];
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
 * @title bidrag-vedtak
 * @version v1
 * @baseUrl https://bidrag-vedtak-q2.intern.dev.nav.no
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  vedtaksforslag = {
    /**
     * No description
     *
     * @tags vedtak-controller
     * @name OppdaterVedtaksforslag
     * @summary Oppdaterer grunnlag på et eksisterende vedtaksforslag
     * @request PUT:/vedtaksforslag/{vedtaksid}
     * @secure
     */
    oppdaterVedtaksforslag: (vedtaksid: number, data: OpprettVedtakRequestDto, params: RequestParams = {}) =>
      this.request<number, void>({
        path: `/vedtaksforslag/${vedtaksid}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags vedtak-controller
     * @name FattVedtakFraVedtaksforslag
     * @summary Fatter vedtak fra vedtaksforslag
     * @request POST:/vedtaksforslag/{vedtaksid}
     * @secure
     */
    fattVedtakFraVedtaksforslag: (vedtaksid: number, params: RequestParams = {}) =>
      this.request<number, void>({
        path: `/vedtaksforslag/${vedtaksid}`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags vedtak-controller
     * @name SlettVedtaksforslag
     * @summary Sletter vedtaksforslag
     * @request DELETE:/vedtaksforslag/{vedtaksid}
     * @secure
     */
    slettVedtaksforslag: (vedtaksid: number, params: RequestParams = {}) =>
      this.request<number, void>({
        path: `/vedtaksforslag/${vedtaksid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags vedtak-controller
     * @name OpprettVedtaksforslag
     * @summary Oppretter nytt vedtaksforslag
     * @request POST:/vedtaksforslag
     * @secure
     */
    opprettVedtaksforslag: (data: OpprettVedtakRequestDto, params: RequestParams = {}) =>
      this.request<number, void | ConflictException>({
        path: `/vedtaksforslag`,
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
     * @name HentAlleVedtaksforslag
     * @summary Hent alle vedtaksforslag ider
     * @request GET:/vedtaksforslag/alle
     * @secure
     */
    hentAlleVedtaksforslag: (
      query?: {
        /**
         * @format int32
         * @default 100
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<number[], any>({
        path: `/vedtaksforslag/alle`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),
  };
  vedtak = {
    /**
     * No description
     *
     * @tags vedtak-controller
     * @name HentVedtakForUnikReferanse
     * @summary Henter et vedtak tilknyttet unik referanse
     * @request POST:/vedtak/unikreferanse
     * @secure
     */
    hentVedtakForUnikReferanse: (data: string, params: RequestParams = {}) =>
      this.request<VedtakDto, void>({
        path: `/vedtak/unikreferanse`,
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
     * @name OppdaterVedtak
     * @summary Oppdaterer grunnlag på et eksisterende vedtak
     * @request POST:/vedtak/oppdater/{vedtaksid}
     * @secure
     */
    oppdaterVedtak: (vedtaksid: number, data: OpprettVedtakRequestDto, params: RequestParams = {}) =>
      this.request<number, void>({
        path: `/vedtak/oppdater/${vedtaksid}`,
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
     * @name HentVedtakForStonad
     * @summary Henter endringsvedtak for angitt sak, skyldner, kravhaver og type
     * @request POST:/vedtak/hent-vedtak
     * @secure
     */
    hentVedtakForStonad: (data: HentVedtakForStonadRequest, params: RequestParams = {}) =>
      this.request<HentVedtakForStonadResponse, void>({
        path: `/vedtak/hent-vedtak`,
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
     * @name HentManuelleVedtak
     * @summary Henter manuelle vedtak for BP i angitt periode
     * @request POST:/vedtak/hent-manuelle-vedtak
     * @secure
     */
    hentManuelleVedtak: (data: HentManuelleVedtakRequest, params: RequestParams = {}) =>
      this.request<HentVedtakForStonadResponse, void>({
        path: `/vedtak/hent-manuelle-vedtak`,
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
      this.request<OpprettVedtakResponseDto, void | ConflictException>({
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
     * @name OpprettVedtak1
     * @summary Oppretter nytt vedtak
     * @request POST:/vedtak
     * @secure
     */
    opprettVedtak1: (data: OpprettVedtakRequestDto, params: RequestParams = {}) =>
      this.request<OpprettVedtakResponseDto, void | ConflictException>({
        path: `/vedtak`,
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
     * @request GET:/vedtak/{vedtaksid}
     * @secure
     */
    hentVedtak: (vedtaksid: number, params: RequestParams = {}) =>
      this.request<VedtakDto, void>({
        path: `/vedtak/${vedtaksid}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags vedtak-controller
     * @name HentVedtakForBehandlingsreferanse
     * @summary Henter et vedtak for angitt kilde og behandlingsreferanse
     * @request GET:/vedtak/hent-vedtak-for-behandlingsreferanse/{kilde}/{behandlingsreferanse}
     * @secure
     */
    hentVedtakForBehandlingsreferanse: (
      kilde: BehandlingsrefKilde,
      behandlingsreferanse: string,
      params: RequestParams = {},
    ) =>
      this.request<number[], void>({
        path: `/vedtak/hent-vedtak-for-behandlingsreferanse/${kilde}/${behandlingsreferanse}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}
