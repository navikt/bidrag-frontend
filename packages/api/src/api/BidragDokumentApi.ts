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

/**
 * Metadata om en aktør
 * @default null
 */
export interface AktorDto {
    /**
     * Identifaktor til aktøren
     * @default ""
     */
    ident: string;
    type?: IdentType | null;
}

/**
 *
 * Avsender journalposten ble sendt fra hvis utgående.
 * Mottaker journalposten skal sendes til hvis inngående.
 * @default null
 */
export interface AvsenderMottakerDto {
    /**
     * Avsenders/Mottakers navn (med eventuelt fornavn bak komma). Skal ikke oppgis hvis ident er en FNR
     * @default ""
     */
    navn?: string | null;
    /**
     * Person ident eller organisasjonsnummer
     * @default ""
     */
    ident?: string | null;
    /**
     * Identtype
     * @default ""
     */
    type: AvsenderMottakerDtoIdType;
    adresse?: MottakerAdresseTo | null;
}

export enum AvsenderMottakerDtoIdType {
    FNR = "FNR",
    SAMHANDLER = "SAMHANDLER",
    ORGNR = "ORGNR",
    UTENLANDSK_ORGNR = "UTENLANDSK_ORGNR",
    UKJENT = "UKJENT",
}

/**
 * Identtypene til en aktør
 * @default null
 */
export enum IdentType {
    AKTOERID = "AKTOERID",
    FNR = "FNR",
    ORGNR = "ORGNR",
}

export enum JournalpostType {
    INNGAENDE = "INNGÅENDE",
    UTGAAENDE = "UTGAAENDE",
    UTGAENDE = "UTGÅENDE",
    NOTAT = "NOTAT",
}

/**
 *
 *     Mottak/Utsendingskanal som settes ved opprettelse av journalpost
 *
 *     DIGITAL - Skal bare settes for inngående journalpost. Oversettes til NAV_NO. Dette er default for inngående
 *
 *     SKANNING_BIDRAG - Skal settes hvis inngående journalpost er mottatt via Bidrag skanning
 *
 *     LOKAL_UTSKRIFT - Skal settes hvis utgående journalpost er sendt via lokal utskrift.
 *     Kanal for utgående journalposter blir ellers satt av dokumentdistribusjons løsningen.
 *
 *     INGEN_DISTRIBUSJON - Skal settes hvis mottaker vil motta forsendelse via posten og ikke har noen gyldig adresse
 * @default null
 */
export enum MottakUtsendingKanal {
    DIGITALT = "DIGITALT",
    SKANNING_BIDRAG = "SKANNING_BIDRAG",
    LOKAL_UTSKRIFT = "LOKAL_UTSKRIFT",
    INGEN_DISTRIBUSJON = "INGEN_DISTRIBUSJON",
}

export interface MottakerAdresseTo {
    adresselinje1: string;
    adresselinje2?: string | null;
    adresselinje3?: string | null;
    bruksenhetsnummer?: string | null;
    /**
     * Lankode må være i ISO 3166-1 alpha-2 format
     * @default ""
     */
    landkode?: string | null;
    /**
     * Lankode må være i ISO 3166-1 alpha-3 format
     * @default ""
     */
    landkode3?: string | null;
    postnummer?: string | null;
    poststed?: string | null;
}

/**
 * Metadata for dokument som skal knyttes til journalpost
 * @default null
 */
export interface OpprettDokumentDto {
    /**
     * Dokumentets tittel
     * @default ""
     */
    tittel: string;
    /**
     * Typen dokument. Brevkoden sier noe om dokumentets innhold og oppbygning.
     * @deprecated
     * @default ""
     */
    brevkode?: string | null;
    /**
     * Typen dokument. Dokumentmal sier noe om dokumentets innhold og oppbygning.
     * @default ""
     */
    dokumentmalId?: string | null;
    /**
     * Referansen til dokumentet hvis det er lagret i et annet arkivsystem
     * @default ""
     */
    dokumentreferanse?: string | null;
    /**
     * Selve PDF dokumentet formatert som Base64
     * @deprecated
     * @default ""
     */
    dokument?: string | null;
    /**
     * Selve PDF dokumentet formatert som Base64
     * @format byte
     * @default ""
     */
    fysiskDokument?: string | null;
}

export interface OpprettEttersendingsoppgaveVedleggDto {
    tittel?: string | null;
    url?: string | null;
    vedleggsnr: string;
}

export interface OpprettEttersendingsppgaveDto {
    tittel: string;
    skjemaId: string;
    språk: Sprak;
    /** @format int32 */
    innsendingsFristDager: number;
    vedleggsliste: OpprettEttersendingsoppgaveVedleggDto[];
}

/**
 * Metadata for opprettelse av journalpost
 * @default null
 */
export interface OpprettJournalpostRequest {
    /**
     * Om journalposten skal journalføres etter opprettelse. Journalføring betyr at journalpost låses for framtidige endringer
     * @default false
     */
    skalFerdigstilles: boolean;
    /**
     * Tittel på journalposten (Tittel settes til hoveddokumentes tittel for Joark journalposter)
     * @deprecated
     * @default ""
     */
    tittel?: string | null;
    gjelder?: AktorDto | null;
    /**
     * Ident til brukeren som journalposten gjelder
     * @default ""
     */
    gjelderIdent?: string | null;
    avsenderMottaker?: AvsenderMottakerDto | null;
    /**
     *
     *     Dokumenter som skal knyttes til journalpost.
     *     En journalpost må minst ha et dokument.
     *     Det første dokument i meldingen blir tilknyttet som hoveddokument på journalposten.
     * @default ""
     */
    dokumenter: OpprettDokumentDto[];
    /**
     * Saksnummer til bidragsaker som journalpost skal tilknyttes
     * @default ""
     */
    tilknyttSaker: string[];
    /**
     * Behandlingstema
     * @default ""
     */
    behandlingstema?: string | null;
    /**
     * Dato journalposten mottatt. Kan settes for inngående journalposter. Settes til i dag som default hvis ikke satt
     * @format date-time
     * @default ""
     */
    datoMottatt?: string | null;
    /**
     * Dato når selve dokumentet ble opprettet
     * @format date-time
     * @default ""
     */
    datoDokument?: string | null;
    kanal?: MottakUtsendingKanal | null;
    /**
     * Tema (Gyldige verdier er FAR og BID). Hvis det ikke settes opprettes journalpost med tema BID
     * @default "BID"
     */
    tema?: string;
    /**
     * Journalposttype, dette kan enten være Inngående, Utgående eller Notat
     * @default ""
     */
    journalposttype: JournalpostType;
    /**
     * Referanse for journalpost. Hvis journalpost med samme referanse finnes vil tjenesten gå videre uten å opprette journalpost. Kan brukes for å lage løsninger idempotent
     * @default ""
     */
    referanseId?: string | null;
    /**
     * NAV-enheten som oppretter journalposten
     * @deprecated
     * @default ""
     */
    journalfoerendeEnhet?: string | null;
    /**
     * NAV-enheten som oppretter journalposten
     * @default ""
     */
    journalførendeEnhet?: string | null;
    /**
     * Ident til saksbehandler som oppretter journalpost. Dette vil prioriteres over ident som tilhører tokenet til kallet.
     * @default ""
     */
    saksbehandlerIdent?: string | null;
    ettersendingsoppgave?: OpprettEttersendingsppgaveDto | null;
}

/** @default null */
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

/**
 * Metadata til en respons etter journalpost ble opprettet
 * @default null
 */
export interface OpprettJournalpostResponse {
    /**
     * Journalpostid på journalpost som ble opprettet
     * @default ""
     */
    journalpostId?: string | null;
    /**
     * Liste med dokumenter som er knyttet til journalposten
     * @default ""
     */
    dokumenter: OpprettDokumentDto[];
}

/**
 * En avvikshendelse som kan utføres på en journalpost
 * @default null
 */
export interface Avvikshendelse {
    /**
     * Type avvik
     * @default ""
     */
    avvikType: string;
    /**
     * Manuell beskrivelse av avvik
     * @default ""
     */
    beskrivelse?: string | null;
    /**
     * Eventuelle detaljer som skal følge avviket
     * @default ""
     */
    detaljer: Record<string, string>;
    /**
     * Saksnummer til sak når journalpost er journalført
     * @default ""
     */
    saksnummer?: string | null;
    adresse?: DistribuerTilAdresse | null;
    /**
     * Dokumenter som brukes ved kopiering ny journalpost. Benyttes ved avvik KOPIER_FRA_ANNEN_FAGOMRADE
     * @default ""
     */
    dokumenter?: any[] | null;
}

/**
 * Adresse for hvor brev sendes ved sentral print
 * @default null
 */
export interface DistribuerTilAdresse {
    adresselinje1?: string | null;
    adresselinje2?: string | null;
    adresselinje3?: string | null;
    /**
     * ISO 3166-1 alpha-2 to-bokstavers landkode
     * @default ""
     */
    land?: string | null;
    postnummer?: string | null;
    poststed?: string | null;
}

export enum DokumentArkivSystemDto {
    JOARK = "JOARK",
    MIDLERTIDLIG_BREVLAGER = "MIDLERTIDLIG_BREVLAGER",
    UKJENT = "UKJENT",
    BIDRAG = "BIDRAG",
    FORSENDELSE = "FORSENDELSE",
}

/**
 * Metadata for et dokument
 * @default null
 */
export interface DokumentDto {
    /**
     * Referansen til dokumentet i arkivsystemet
     * @default ""
     */
    dokumentreferanse?: string | null;
    /**
     * Journalpost hvor dokumentet er arkivert. Dette brukes hvis dokumentet er arkivert i annen arkivsystem enn det som er sendt med i forespørsel.
     * @default ""
     */
    journalpostId?: string | null;
    /**
     * Inngående (I), utgående (U) dokument, (X) internt notat
     * @deprecated
     * @default ""
     */
    dokumentType?: string | null;
    /**
     * Kort oppsummering av dokumentets innhold
     * @default ""
     */
    tittel?: string | null;
    /**
     * Selve PDF dokumentet formatert som Base64
     * @default ""
     */
    dokument?: string | null;
    /**
     * Typen dokument. Brevkoden sier noe om dokumentets innhold og oppbygning. Erstattes av dokumentmalId
     * @deprecated
     * @default ""
     */
    brevkode?: string | null;
    /**
     * Typen dokument. Dokumentmal sier noe om dokumentets innhold og oppbygning.
     * @default ""
     */
    dokumentmalId?: string | null;
    status?: DokumentStatusDto | null;
    arkivSystem?: DokumentArkivSystemDto | null;
    /**
     * Metadata om dokumentet
     * @default ""
     */
    metadata: Record<string, string>;
}

export enum DokumentStatusDto {
    IKKE_BESTILT = "IKKE_BESTILT",
    BESTILLING_FEILET = "BESTILLING_FEILET",
    UNDER_PRODUKSJON = "UNDER_PRODUKSJON",
    UNDER_REDIGERING = "UNDER_REDIGERING",
    FERDIGSTILT = "FERDIGSTILT",
    AVBRUTT = "AVBRUTT",
}

/**
 * Responsen til en avvikshendelse
 * @default null
 */
export interface BehandleAvvikshendelseResponse {
    /**
     * Type avvik
     * @default ""
     */
    avvikType: string;
    /**
     * Oppgave id for oppgaven som ble opprettet på bakgrunn av avviket
     * @format int64
     * @default ""
     */
    oppgaveId?: number | null;
    /**
     * Enhetsnummer til enheten som oppgaven er tildelt
     * @default ""
     */
    tildeltEnhetsnr?: string | null;
    /**
     * Oppgavens tema
     * @default ""
     */
    tema?: string | null;
    /**
     * Oppgavens type
     * @default ""
     */
    oppgavetype?: string | null;
}

/**
 * Bestill distribusjon av journalpost
 * @default null
 */
export interface DistribuerJournalpostRequest {
    /**
     * Identifiserer batch som forsendelsen inngår i. Brukes for sporing
     * @default ""
     */
    batchId?: string | null;
    /**
     * Forsendelsen er skrevet ut og distribuert lokalt. Distribusjon registreres men ingen distribusjon bestilles.
     * @default false
     */
    lokalUtskrift: boolean;
    adresse?: DistribuerTilAdresse | null;
    ettersendingsoppgave?: OpprettEttersendingsppgaveDto | null;
}

/**
 * Respons etter bestilt distribusjon
 * @default null
 */
export interface DistribuerJournalpostResponse {
    /**
     * Journalpostid for dokument som det ble bestilt distribusjon for
     * @default ""
     */
    journalpostId: string;
    /**
     * Bestillingid som unikt identifiserer distribusjonsbestillingen. Vil være null hvis ingen distribusjon er bestilt.
     * @default ""
     */
    bestillingsId?: string | null;
    ettersendingsoppgave?: OpprettEttersendingsoppgaveResponseDto | null;
}

export interface OpprettEttersendingsoppgaveResponseDto {
    innsendingsId: string;
}

/**
 * Metadata for endring av et dokument
 * @default null
 */
export interface EndreDokument {
    /**
     * Brevkoden til dokumentet
     * @default ""
     */
    brevkode?: string | null;
    /**
     * Identifikator av dokument informasjon
     * @deprecated
     * @default ""
     */
    dokId?: string | null;
    /**
     * Identifikator til dokumentet
     * @default ""
     */
    dokumentreferanse?: string | null;
    /**
     * Tittel på dokumentet
     * @default ""
     */
    tittel?: string | null;
}

/**
 * Metadata for endring av en journalpost
 * @default null
 */
export interface EndreJournalpostCommand {
    /**
     * Identifikator av journalpost
     * @default ""
     */
    journalpostId?: string | null;
    /**
     * Avsenders navn (med eventuelt fornavn bak komma)
     * @deprecated
     * @default ""
     */
    avsenderNavn?: string | null;
    /**
     * Avsender/Mottakers navn (med eventuelt fornavn bak komma)
     * @default ""
     */
    avsenderMottakerNavn?: string | null;
    /**
     * Avsender/Mottakers id
     * @default ""
     */
    avsenderMottakerId?: string | null;
    /**
     * Kort oppsummert av journalført innhold
     * @default ""
     */
    beskrivelse?: string | null;
    /**
     * Dato for dokument i journalpost
     * @format date
     * @default ""
     */
    dokumentDato?: string | null;
    /**
     * Fnr/dnr/bostnr eller orgnr for hvem/hva dokumentet gjelder
     * @default ""
     */
    gjelder?: string | null;
    /**
     * Dato dokument ble journalført
     * @format date
     * @default ""
     */
    journaldato?: string | null;
    /**
     * Saksnummer til bidragsaker som journalpost skal tilknyttes
     * @default ""
     */
    tilknyttSaker: string[];
    /**
     * En liste over endringer i dokumenter
     * @default ""
     */
    endreDokumenter: EndreDokument[];
    /**
     * Behandlingstema
     * @default ""
     */
    behandlingstema?: string | null;
    /**
     * Endre fagområde
     * @default ""
     */
    fagomrade?: string | null;
    gjelderType?: IdentType | null;
    /**
     * Tittel på journalposten
     * @default ""
     */
    tittel?: string | null;
    /**
     * Skal journalposten journalføres aka. registreres
     * @default false
     */
    skalJournalfores: boolean;
    /**
     * Liste med retur detaljer som skal endres
     * @default ""
     */
    endreReturDetaljer: EndreReturDetaljer[];
}

/**
 * Metadata for endring av et retur detalj
 * @default null
 */
export interface EndreReturDetaljer {
    /**
     * Dato på retur detaljer som skal endres
     * @format date
     * @default ""
     */
    originalDato?: string | null;
    /**
     * Ny dato på retur detaljer
     * @format date
     * @default ""
     */
    nyDato?: string | null;
    /**
     * Beskrivelse av retur (eks. addresse forsøkt sendt)
     * @default ""
     */
    beskrivelse: string;
}

export enum DokumentFormatDto {
    PDF = "PDF",
    MBDOK = "MBDOK",
    HTML = "HTML",
}

export interface DokumentMetadata {
    /**
     * Journalpostid med arkiv prefiks som skal benyttes når dokumentet hentes
     * @default ""
     */
    journalpostId?: string | null;
    dokumentreferanse?: string | null;
    tittel?: string | null;
    /**
     * Hvilken format dokument er på. Dette forteller hvordan dokumentet må åpnes.
     * @default ""
     */
    format: DokumentFormatDto;
    /**
     * Status på dokumentet
     * @default ""
     */
    status: DokumentStatusDto;
    /**
     * Hvilken arkivsystem dokumentet er lagret på
     * @default ""
     */
    arkivsystem: DokumentArkivSystemDto;
}

/**
 * Metadata for en url til et fysisk dokument
 * @default null
 */
export interface DokumentTilgangResponse {
    /**
     * url til et fysisk dokument
     * @default ""
     */
    dokumentUrl: string;
    /**
     * type system som er ansvarlig for dokumentet, eks: BREVLAGER
     * @default ""
     */
    type: string;
}

export interface EttersendingsoppgaveVedleggDto {
    tittel?: string | null;
    url?: string | null;
    vedleggsnr: string;
    status: EttersendingsoppgaveVedleggDtoStatusEnum;
}

export interface EttersendingsppgaveDto {
    tittel: string;
    skjemaId: string;
    innsendingsId?: string | null;
    språk: string;
    status: EttersendingsppgaveDtoStatusEnum;
    /** @format date */
    opprettetDato?: string | null;
    /** @format date */
    fristDato?: string | null;
    /** @format date */
    slettesDato?: string | null;
    vedleggsliste: EttersendingsoppgaveVedleggDto[];
}

/**
 * Metadata til en journalpost
 * @default null
 */
export interface JournalpostDto {
    /**
     * Avsenders navn (med eventuelt fornavn bak komma)
     * @deprecated
     * @default ""
     */
    avsenderNavn?: string | null;
    avsenderMottaker?: AvsenderMottakerDto | null;
    /**
     * Dokumentene som følger journalposten
     * @default ""
     */
    dokumenter: DokumentDto[];
    /**
     * Dato for dokument i journalpost
     * @format date
     * @default ""
     */
    dokumentDato?: string | null;
    /**
     * Tidspunkt for dokument i journalpost
     * @format date-time
     * @default ""
     */
    dokumentTidspunkt?: string | null;
    /**
     * Dato dokumentene på journalposten ble sendt til bruker.
     * @format date
     * @default ""
     */
    ekspedertDato?: string | null;
    /**
     * Fagområdet for journalposten. BID for bidrag og FAR for farskap
     * @default ""
     */
    fagomrade?: string | null;
    /**
     * Ident for hvem/hva dokumente(t/ne) gjelder
     * @default ""
     */
    gjelderIdent?: string | null;
    gjelderAktor?: AktorDto | null;
    /**
     * Kort oppsummert av journalført innhold
     * @default ""
     */
    innhold?: string | null;
    /**
     * Enhetsnummer hvor journalføring ble gjort
     * @default ""
     */
    journalforendeEnhet?: string | null;
    /**
     * Saksbehandler som var journalfører
     * @default ""
     */
    journalfortAv?: string | null;
    /**
     * Dato dokument ble journalført
     * @format date
     * @default ""
     */
    journalfortDato?: string | null;
    /**
     * Identifikator av journalpost i midlertidig brevlager eller fra joark på formatet [BID|JOARK]-<journalpostId>
     * @default ""
     */
    journalpostId?: string | null;
    kilde?: Kanal | null;
    kanal?: Kanal | null;
    /**
     * Dato for når dokument er mottat, dvs. dato for journalføring eller skanning
     * @format date
     * @default ""
     */
    mottattDato?: string | null;
    /**
     * Inngående (I), utgående (U) journalpost; (X) internt notat
     * @default ""
     */
    dokumentType?: string | null;
    /**
     * Journalpostens status, (A, D, J, M, O, R, S, T, U, KP, EJ, E)
     * @deprecated
     * @default ""
     */
    journalstatus?: string | null;
    status?: JournalpostStatus | null;
    /**
     * Om journalposten er feilført på bidragssak
     * @default false
     */
    feilfort?: boolean | null;
    brevkode?: KodeDto | null;
    returDetaljer?: ReturDetaljer | null;
    /**
     * Joark journalpostid for bidrag journalpost som er arkivert i Joark
     * @default ""
     */
    joarkJournalpostId?: string | null;
    distribuertTilAdresse?: DistribuerTilAdresse | null;
    /**
     * Informasjon om returdetaljer til journalpost
     * @default ""
     */
    sakstilknytninger: string[];
    /**
     * Språket til dokumentet i Journalposten
     * @default ""
     */
    språk?: string | null;
    /**
     * Saksbehandler som opprettet journalposten
     * @default ""
     */
    opprettetAvIdent?: string | null;
    /**
     * Referanse til originale kilden til journalposten. Kan være referanse til forsendelse eller bidrag journalpost med prefiks. Feks BID_12323 eller BIF_123213
     * @default ""
     */
    eksternReferanseId?: string | null;
    ettersendingsppgave?: EttersendingsppgaveDto | null;
}

export enum JournalpostStatus {
    AVVIK_ENDRE_FAGOMRADE = "AVVIK_ENDRE_FAGOMRADE",
    AVVIK_BESTILL_RESKANNING = "AVVIK_BESTILL_RESKANNING",
    AVVIK_BESTILL_SPLITTING = "AVVIK_BESTILL_SPLITTING",
    MOTTATT = "MOTTATT",
    JOURNALFORT = "JOURNALFØRT",
    EKSPEDERT = "EKSPEDERT",
    EKSPEDERT_JOARK = "EKSPEDERT_JOARK",
    MOTTAKSREGISTRERT = "MOTTAKSREGISTRERT",
    UKJENT = "UKJENT",
    DISTRIBUERT = "DISTRIBUERT",
    AVBRUTT = "AVBRUTT",
    KLAR_FOR_DISTRIBUSJON = "KLAR_FOR_DISTRIBUSJON",
    DOKUMENT_SLETTET = "DOKUMENT_SLETTET",
    RETUR = "RETUR",
    FERDIGSTILT = "FERDIGSTILT",
    FEILREGISTRERT = "FEILREGISTRERT",
    RESERVERT = "RESERVERT",
    UTGAR = "UTGÅR",
    SLETTET = "SLETTET",
    UNDER_OPPRETTELSE = "UNDER_OPPRETTELSE",
    TIL_LAGRING = "TIL_LAGRING",
    OPPRETTET = "OPPRETTET",
    UNDER_PRODUKSJON = "UNDER_PRODUKSJON",
}

/**
 * Journalposten ble mottatt/sendt ut i kanal
 * @default null
 */
export enum Kanal {
    NAV_NO = "NAV_NO",
    NAV_NO_BID = "NAV_NO_BID",
    SKAN_BID = "SKAN_BID",
    SKAN_NETS = "SKAN_NETS",
    SKAN_IM = "SKAN_IM",
    LOKAL_UTSKRIFT = "LOKAL_UTSKRIFT",
    SENTRAL_UTSKRIFT = "SENTRAL_UTSKRIFT",
    SDP = "SDP",
    INGEN_DISTRIBUSJON = "INGEN_DISTRIBUSJON",
    INNSENDT_NAV_ANSATT = "INNSENDT_NAV_ANSATT",
    NAV_NO_UINNLOGGET = "NAV_NO_UINNLOGGET",
    NAV_NO_CHAT = "NAV_NO_CHAT",
}

/**
 * Metadata for kode vs dekode i et kodeobjekt
 * @default null
 */
export interface KodeDto {
    /**
     * Koden
     * @default ""
     */
    kode?: string | null;
    /**
     * Dekode (kodebeskrivelse)
     * @default ""
     */
    dekode?: string | null;
    /**
     * Om kodeobjektet inneholder en gyldig verdi
     * @default false
     */
    erGyldig: boolean;
}

/**
 * Metadata for retur detaljer
 * @default null
 */
export interface ReturDetaljer {
    /**
     * Dato for siste retur
     * @format date
     * @default ""
     */
    dato?: string | null;
    /**
     * Totalt antall returer
     * @format int32
     * @default ""
     */
    antall?: number | null;
    /**
     * Liste med logg av alle registrerte returer
     * @default ""
     */
    logg: ReturDetaljerLog[];
}

/**
 * Metadata for retur detaljer log
 * @default null
 */
export interface ReturDetaljerLog {
    /**
     * Dato for retur
     * @format date
     * @default ""
     */
    dato?: string | null;
    /**
     * Beskrivelse av retur (eks. addresse forsøkt sendt)
     * @default ""
     */
    beskrivelse?: string | null;
    /**
     * Returdetalje er låst for endring. Dette blir satt etter en ny distribusjon er bestilt
     * @default false
     */
    locked?: boolean | null;
}

/**
 * Metadata til en respons etter journalpost med tilhørende data
 * @default null
 */
export interface JournalpostResponse {
    journalpost?: JournalpostDto | null;
    /**
     * alle saker som journalposten er tilknyttet
     * @default ""
     */
    sakstilknytninger: string[];
}

export interface DistribusjonInfoDto {
    /** @default "" */
    journalstatus: JournalpostStatus;
    kanal: string;
    utsendingsinfo?: UtsendingsInfoDto | null;
    /** @format date-time */
    distribuertDato?: string | null;
    distribuertAvIdent?: string | null;
    bestillingId?: string | null;
}

export interface UtsendingsInfoDto {
    varseltype?: UtsendingsInfoVarselTypeDto | null;
    adresse?: string | null;
    tittel?: string | null;
    varslingstekst?: string | null;
}

export enum UtsendingsInfoVarselTypeDto {
    EPOST = "EPOST",
    SMS = "SMS",
    DIGIPOST = "DIGIPOST",
    FYSISK_POST = "FYSISK_POST",
}

export enum EttersendingsoppgaveVedleggDtoStatusEnum {
    IKKE_VALGT = "IKKE_VALGT",
    LASTET_OPP = "LASTET_OPP",
    INNSENDT = "INNSENDT",
    SEND_SENERE = "SEND_SENERE",
    SENDES_AV_ANDRE = "SENDES_AV_ANDRE",
    SENDES_IKKE = "SENDES_IKKE",
    LASTET_OPP_IKKE_RELEVANT_LENGER = "LASTET_OPP_IKKE_RELEVANT_LENGER",
    LEVERT_DOKUMENTASJON_TIDLIGERE = "LEVERT_DOKUMENTASJON_TIDLIGERE",
    HAR_IKKE_DOKUMENTASJONEN = "HAR_IKKE_DOKUMENTASJONEN",
    NAV_KAN_HENTE_DOKUMENTASJON = "NAV_KAN_HENTE_DOKUMENTASJON",
    UKJENT = "UKJENT",
}

export enum EttersendingsppgaveDtoStatusEnum {
    OPPRETTET = "OPPRETTET",
    UTFYLT = "UTFYLT",
    INNSENDT = "INNSENDT",
    SLETTET_AV_BRUKER = "SLETTET_AV_BRUKER",
    AUTOMATISK_SLETTET = "AUTOMATISK_SLETTET",
    UKJENT = "UKJENT",
    IKKE_OPPRETTET = "IKKE_OPPRETTET",
}

export enum OpprettJournalpostParamsArkivSystemEnum {
    JOARK = "JOARK",
    BIDRAG = "BIDRAG",
}

export enum OpprettJournalpostParamsEnum {
    JOARK = "JOARK",
    BIDRAG = "BIDRAG",
}

export enum HentAvvikEnum {
    ARKIVERE_JOURNALPOST = "ARKIVERE_JOURNALPOST",
    BESTILL_ORIGINAL = "BESTILL_ORIGINAL",
    BESTILL_RESKANNING = "BESTILL_RESKANNING",
    BESTILL_SPLITTING = "BESTILL_SPLITTING",
    ENDRE_FAGOMRADE = "ENDRE_FAGOMRADE",
    SEND_TIL_FAGOMRADE = "SEND_TIL_FAGOMRADE",
    KOPIER_FRA_ANNEN_FAGOMRADE = "KOPIER_FRA_ANNEN_FAGOMRADE",
    SEND_KOPI_TIL_FAGOMRADE = "SEND_KOPI_TIL_FAGOMRADE",
    FEILFORE_SAK = "FEILFORE_SAK",
    INNG_TIL_UTG_DOKUMENT = "INNG_TIL_UTG_DOKUMENT",
    OVERFOR_TIL_ANNEN_ENHET = "OVERFOR_TIL_ANNEN_ENHET",
    SLETT_JOURNALPOST = "SLETT_JOURNALPOST",
    TREKK_JOURNALPOST = "TREKK_JOURNALPOST",
    REGISTRER_RETUR = "REGISTRER_RETUR",
    MANGLER_ADRESSE = "MANGLER_ADRESSE",
    BESTILL_NY_DISTRIBUSJON = "BESTILL_NY_DISTRIBUSJON",
    FARSKAP_UTELUKKET = "FARSKAP_UTELUKKET",
}

export enum HentAvvikEnum1 {
    ARKIVERE_JOURNALPOST = "ARKIVERE_JOURNALPOST",
    BESTILL_ORIGINAL = "BESTILL_ORIGINAL",
    BESTILL_RESKANNING = "BESTILL_RESKANNING",
    BESTILL_SPLITTING = "BESTILL_SPLITTING",
    ENDRE_FAGOMRADE = "ENDRE_FAGOMRADE",
    SEND_TIL_FAGOMRADE = "SEND_TIL_FAGOMRADE",
    KOPIER_FRA_ANNEN_FAGOMRADE = "KOPIER_FRA_ANNEN_FAGOMRADE",
    SEND_KOPI_TIL_FAGOMRADE = "SEND_KOPI_TIL_FAGOMRADE",
    FEILFORE_SAK = "FEILFORE_SAK",
    INNG_TIL_UTG_DOKUMENT = "INNG_TIL_UTG_DOKUMENT",
    OVERFOR_TIL_ANNEN_ENHET = "OVERFOR_TIL_ANNEN_ENHET",
    SLETT_JOURNALPOST = "SLETT_JOURNALPOST",
    TREKK_JOURNALPOST = "TREKK_JOURNALPOST",
    REGISTRER_RETUR = "REGISTRER_RETUR",
    MANGLER_ADRESSE = "MANGLER_ADRESSE",
    BESTILL_NY_DISTRIBUSJON = "BESTILL_NY_DISTRIBUSJON",
    FARSKAP_UTELUKKET = "FARSKAP_UTELUKKET",
}

export enum HentAvvikEnum2 {
    ARKIVERE_JOURNALPOST = "ARKIVERE_JOURNALPOST",
    BESTILL_ORIGINAL = "BESTILL_ORIGINAL",
    BESTILL_RESKANNING = "BESTILL_RESKANNING",
    BESTILL_SPLITTING = "BESTILL_SPLITTING",
    ENDRE_FAGOMRADE = "ENDRE_FAGOMRADE",
    SEND_TIL_FAGOMRADE = "SEND_TIL_FAGOMRADE",
    KOPIER_FRA_ANNEN_FAGOMRADE = "KOPIER_FRA_ANNEN_FAGOMRADE",
    SEND_KOPI_TIL_FAGOMRADE = "SEND_KOPI_TIL_FAGOMRADE",
    FEILFORE_SAK = "FEILFORE_SAK",
    INNG_TIL_UTG_DOKUMENT = "INNG_TIL_UTG_DOKUMENT",
    OVERFOR_TIL_ANNEN_ENHET = "OVERFOR_TIL_ANNEN_ENHET",
    SLETT_JOURNALPOST = "SLETT_JOURNALPOST",
    TREKK_JOURNALPOST = "TREKK_JOURNALPOST",
    REGISTRER_RETUR = "REGISTRER_RETUR",
    MANGLER_ADRESSE = "MANGLER_ADRESSE",
    BESTILL_NY_DISTRIBUSJON = "BESTILL_NY_DISTRIBUSJON",
    FARSKAP_UTELUKKET = "FARSKAP_UTELUKKET",
}

export enum HentAvvikEnum3 {
    ARKIVERE_JOURNALPOST = "ARKIVERE_JOURNALPOST",
    BESTILL_ORIGINAL = "BESTILL_ORIGINAL",
    BESTILL_RESKANNING = "BESTILL_RESKANNING",
    BESTILL_SPLITTING = "BESTILL_SPLITTING",
    ENDRE_FAGOMRADE = "ENDRE_FAGOMRADE",
    SEND_TIL_FAGOMRADE = "SEND_TIL_FAGOMRADE",
    KOPIER_FRA_ANNEN_FAGOMRADE = "KOPIER_FRA_ANNEN_FAGOMRADE",
    SEND_KOPI_TIL_FAGOMRADE = "SEND_KOPI_TIL_FAGOMRADE",
    FEILFORE_SAK = "FEILFORE_SAK",
    INNG_TIL_UTG_DOKUMENT = "INNG_TIL_UTG_DOKUMENT",
    OVERFOR_TIL_ANNEN_ENHET = "OVERFOR_TIL_ANNEN_ENHET",
    SLETT_JOURNALPOST = "SLETT_JOURNALPOST",
    TREKK_JOURNALPOST = "TREKK_JOURNALPOST",
    REGISTRER_RETUR = "REGISTRER_RETUR",
    MANGLER_ADRESSE = "MANGLER_ADRESSE",
    BESTILL_NY_DISTRIBUSJON = "BESTILL_NY_DISTRIBUSJON",
    FARSKAP_UTELUKKET = "FARSKAP_UTELUKKET",
}

import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    HeadersDefaults,
    ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
    extends Omit<
        AxiosRequestConfig,
        "data" | "params" | "url" | "responseType"
    > {
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

export type RequestParams = Omit<
    FullRequestParams,
    "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
    extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
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

    constructor({
        securityWorker,
        secure,
        format,
        ...axiosConfig
    }: ApiConfig<SecurityDataType> = {}) {
        this.instance = axios.create({
            ...axiosConfig,
            baseURL:
                axiosConfig.baseURL ||
                "https://bidrag-dokument.intern.dev.nav.no/bidrag-dokument",
        });
        this.secure = secure;
        this.format = format;
        this.securityWorker = securityWorker;
    }

    public setSecurityData = (data: SecurityDataType | null) => {
        this.securityData = data;
    };

    protected mergeRequestParams(
        params1: AxiosRequestConfig,
        params2?: AxiosRequestConfig,
    ): AxiosRequestConfig {
        const method = params1.method || (params2 && params2.method);

        return {
            ...this.instance.defaults,
            ...params1,
            ...(params2 || {}),
            headers: {
                ...((method &&
                    this.instance.defaults.headers[
                        method.toLowerCase() as keyof HeadersDefaults
                    ]) ||
                    {}),
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
            const propertyContent: any[] =
                property instanceof Array ? property : [property];

            for (const formItem of propertyContent) {
                const isFileType =
                    formItem instanceof Blob || formItem instanceof File;
                formData.append(
                    key,
                    isFileType ? formItem : this.stringifyFormItem(formItem),
                );
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

        if (
            type === ContentType.FormData &&
            body &&
            body !== null &&
            typeof body === "object"
        ) {
            body = this.createFormData(body as Record<string, unknown>);
        }

        if (
            type === ContentType.Text &&
            body &&
            body !== null &&
            typeof body !== "string"
        ) {
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
 * @title bidrag-dokument
 * @version v1
 * @baseUrl https://bidrag-dokument.intern.dev.nav.no/bidrag-dokument
 */
export class Api<SecurityDataType> extends HttpClient<SecurityDataType> {
    journalpost = {
        /**
         * @description Opprett notat eller utgående journalpost i midlertidlig brevlager. Opprett inngående, notat eller utgående journalpost i Joark
         *
         * @tags journalpost-controller
         * @name OpprettJournalpost
         * @request POST:/journalpost/{arkivSystem}
         * @secure
         */
        opprettJournalpost: (
            arkivSystem: OpprettJournalpostParamsEnum,
            data: OpprettJournalpostRequest,
            params: RequestParams = {},
        ) =>
            this.request<
                OpprettJournalpostResponse,
                OpprettJournalpostResponse
            >({
                path: `/journalpost/${arkivSystem}`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    journal = {
        /**
         * @description Henter mulige avvik for en journalpost, id på formatet [BID|JOARK]-<journalpostId>
         *
         * @tags journalpost-controller
         * @name HentAvvik
         * @request GET:/journal/{journalpostIdForKildesystem}/avvik
         * @secure
         */
        hentAvvik: (
            journalpostIdForKildesystem: string,
            query?: {
                /**
                 * journalposten tilhører sak
                 * @default ""
                 */
                saksnummer?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<
                HentAvvikEnum[],
                HentAvvikEnum1[] | HentAvvikEnum2[] | HentAvvikEnum3[]
            >({
                path: `/journal/${journalpostIdForKildesystem}/avvik`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * @description Lagrer et avvik for en journalpost, id på formatet [BID|JOARK]-<journalpostId>
         *
         * @tags journalpost-controller
         * @name BehandleAvvik
         * @request POST:/journal/{journalpostIdForKildesystem}/avvik
         * @secure
         */
        behandleAvvik: (
            journalpostIdForKildesystem: string,
            data: Avvikshendelse,
            params: RequestParams = {},
        ) =>
            this.request<
                BehandleAvvikshendelseResponse,
                BehandleAvvikshendelseResponse
            >({
                path: `/journal/${journalpostIdForKildesystem}/avvik`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Bestill distribusjon av journalpost
         *
         * @tags journalpost-controller
         * @name DistribuerJournalpost
         * @request POST:/journal/distribuer/{joarkJournalpostId}
         * @secure
         */
        distribuerJournalpost: (
            joarkJournalpostId: string,
            data: DistribuerJournalpostRequest,
            query?: {
                batchId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<
                DistribuerJournalpostResponse,
                DistribuerJournalpostResponse
            >({
                path: `/journal/distribuer/${joarkJournalpostId}`,
                method: "POST",
                query: query,
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Hent en journalpost for en id på formatet [BID|JOARK]-<journalpostId>
         *
         * @tags journalpost-controller
         * @name HentJournalpost
         * @request GET:/journal/{journalpostIdForKildesystem}
         * @secure
         */
        hentJournalpost: (
            journalpostIdForKildesystem: string,
            query?: {
                /**
                 * journalposten tilhører sak
                 * @default ""
                 */
                saksnummer?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<JournalpostResponse, JournalpostResponse>({
                path: `/journal/${journalpostIdForKildesystem}`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags journalpost-controller
         * @name PatchJournalpost
         * @summary Endre eksisterende journalpost, id på formatet [BID|JOARK]-<journalpostId>
         * @request PATCH:/journal/{journalpostIdForKildesystem}
         * @secure
         */
        patchJournalpost: (
            journalpostIdForKildesystem: string,
            data: EndreJournalpostCommand,
            params: RequestParams = {},
        ) =>
            this.request<void, void>({
                path: `/journal/${journalpostIdForKildesystem}`,
                method: "PATCH",
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Sjekk om distribusjon av journalpost kan bestilles
         *
         * @tags journalpost-controller
         * @name KanDistribuerJournalpost
         * @request GET:/journal/distribuer/{journalpostId}/enabled
         * @secure
         */
        kanDistribuerJournalpost: (
            journalpostId: string,
            params: RequestParams = {},
        ) =>
            this.request<void, void>({
                path: `/journal/distribuer/${journalpostId}/enabled`,
                method: "GET",
                secure: true,
                ...params,
            }),

        /**
         * @description Hent informasjon om distribusjon av journalpost
         *
         * @tags journalpost-controller
         * @name HentDistribusjonsInfo
         * @request GET:/journal/distribuer/info/{journalpostId}
         * @secure
         */
        hentDistribusjonsInfo: (
            journalpostId: string,
            params: RequestParams = {},
        ) =>
            this.request<DistribusjonInfoDto, any>({
                path: `/journal/distribuer/info/${journalpostId}`,
                method: "GET",
                secure: true,
                ...params,
            }),
    };
    dokument = {
        /**
         * No description
         *
         * @tags dokument-controller
         * @name HentDokument
         * @request GET:/dokument/{journalpostId}
         * @secure
         */
        hentDokument: (
            journalpostId: string,
            query?: {
                resizeToA4?: boolean;
                /** @default true */
                optimizeForPrint?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<string, any>({
                path: `/dokument/${journalpostId}`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dokument-controller
         * @name HentDokumentMetadata
         * @request OPTIONS:/dokument/{journalpostId}
         * @secure
         */
        hentDokumentMetadata: (
            journalpostId: string,
            params: RequestParams = {},
        ) =>
            this.request<DokumentMetadata[], any>({
                path: `/dokument/${journalpostId}`,
                method: "OPTIONS",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dokument-controller
         * @name HentDokument1
         * @request GET:/dokument/{journalpostId}/{dokumentreferanse}
         * @secure
         */
        hentDokument1: (
            journalpostId: string,
            dokumentreferanse: string,
            query?: {
                resizeToA4?: boolean;
                /** @default true */
                optimizeForPrint?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<string, any>({
                path: `/dokument/${journalpostId}/${dokumentreferanse}`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dokument-controller
         * @name HentDokumentMetadata1
         * @request OPTIONS:/dokument/{journalpostId}/{dokumentreferanse}
         * @secure
         */
        hentDokumentMetadata1: (
            journalpostId: string,
            dokumentreferanse: string,
            params: RequestParams = {},
        ) =>
            this.request<DokumentMetadata[], any>({
                path: `/dokument/${journalpostId}/${dokumentreferanse}`,
                method: "OPTIONS",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dokument-controller
         * @name HentDokumenter
         * @request GET:/dokument
         * @secure
         */
        hentDokumenter: (
            query: {
                /**
                 * Liste med dokumenter formatert <Kilde>-<journalpostId>:<dokumentReferanse>
                 * @default ""
                 */
                dokument: string;
                /** @default true */
                optimizeForPrint?: boolean;
                resizeToA4?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<string, any>({
                path: `/dokument`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),
    };
    tilgang = {
        /**
         * No description
         *
         * @tags dokument-controller
         * @name GiTilgangTilDokument
         * @request GET:/tilgang/{journalpostId}/{dokumentreferanse}
         * @secure
         */
        giTilgangTilDokument: (
            journalpostId: string,
            dokumentreferanse: string,
            params: RequestParams = {},
        ) =>
            this.request<DokumentTilgangResponse, any>({
                path: `/tilgang/${journalpostId}/${dokumentreferanse}`,
                method: "GET",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dokument-controller
         * @name GiTilgangTilDokument1
         * @request GET:/tilgang/dokumentreferanse/{dokumentreferanse}
         * @secure
         */
        giTilgangTilDokument1: (
            dokumentreferanse: string,
            params: RequestParams = {},
        ) =>
            this.request<DokumentTilgangResponse, any>({
                path: `/tilgang/dokumentreferanse/${dokumentreferanse}`,
                method: "GET",
                secure: true,
                ...params,
            }),
    };
    sak = {
        /**
         * No description
         *
         * @tags journalpost-controller
         * @name HentJournal
         * @summary Finn saksjournal for et saksnummer, samt parameter 'fagomrade' (FAR - farskapsjournal) og (BID - bidragsjournal)
         * @request GET:/sak/{saksnummer}/journal
         * @secure
         */
        hentJournal: (
            saksnummer: string,
            query?: {
                fagomrade?: string[];
                /** @default false */
                bareFarskapUtelukket?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<JournalpostDto[], JournalpostDto[]>({
                path: `/sak/${saksnummer}/journal`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),
    };
    dokumentreferanse = {
        /**
         * No description
         *
         * @tags dokument-controller
         * @name ErFerdigstilt
         * @request GET:/dokumentreferanse/{dokumentreferanse}/erFerdigstilt
         * @secure
         */
        erFerdigstilt: (
            dokumentreferanse: string,
            params: RequestParams = {},
        ) =>
            this.request<boolean, any>({
                path: `/dokumentreferanse/${dokumentreferanse}/erFerdigstilt`,
                method: "GET",
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dokument-controller
         * @name HentDokument2
         * @request GET:/dokumentreferanse/{dokumentreferanse}
         * @secure
         */
        hentDokument2: (
            dokumentreferanse: string,
            query?: {
                resizeToA4?: boolean;
                /** @default true */
                optimizeForPrint?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<string, any>({
                path: `/dokumentreferanse/${dokumentreferanse}`,
                method: "GET",
                query: query,
                secure: true,
                ...params,
            }),
    };
}
