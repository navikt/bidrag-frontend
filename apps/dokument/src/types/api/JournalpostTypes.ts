export type Sakstilknytning = string;

export interface DistribuerJournalpostResponse {
    bestillingsId: string;
    journalpostId: string;
}
export interface DistribuerJournalpostRequest {
    adresse?: DistribuerTilAdresse;
}

export interface DistribuerTilAdresse {
    adresselinje1: string;
    adresselinje2?: string;
    adresselinje3?: string;
    land: string;
    postnummer?: string;
    poststed?: string;
}

export interface ArkiverJournalpostResponse {
    jpIdJoark: string;
    jpIdBidrag: string;
    journalpostFerdigstilt: boolean;
    journalstatus: string;
}

export class EndreJournalpostRequest {
    skalJournalfores = false;
    journalpostId: string;
    journalforendeEnhet?: string;
    behandlingstema?: string;
    beskrivelse?: string;
    dokumentDato?: string;
    gjelderType?: string;
    fagomrade?: string;
    journaldato?: string;
    gjelder?: string;
    tittel?: string;
    tilknyttSaker?: Sakstilknytning[];
    avsenderNavn?: string;
    endreDokumenter?: EndreDokument[];
    endreReturDetaljer?: EndreReturDetaljer[];
    constructor(journalpostId: string) {
        this.journalpostId = journalpostId;
    }
}

export class LagreJournalpostRequest extends EndreJournalpostRequest {
    skalJournalfores = false;
}

export class RegistrerJournalpostRequest extends EndreJournalpostRequest {
    skalJournalfores = true;
}

export interface JournalpostToRegister {
    journalpostId: string;
    journalforendeEnhet: string;
    mottatDato?: string;
    endreDokumenter: EndreDokument[];
    tilknyttSaker?: string[];
    tittel?: string;
    gjelderIdent: string;
    avsenderNavn?: string;
}

export interface EndreDokument {
    dokId: string;
    tittel: string;
}

export interface EndreReturDetaljer {
    originalDato: string;
    nyDato: string;
    beskrivelse: string;
}

export interface JournalpostResponse {
    journalpost: JournalpostDto;
    sakstilknytninger: Sakstilknytning[];
}

export interface JournalpostDto {
    avsenderNavn?: string;
    avsenderMottaker?: AvsenderMottakerDto;
    dokumenter: DokumentDto[];
    dokumentDato?: string;
    ekspedertDato?: string;
    fagomrade?: string;
    gjelderAktor?: AktorDto;
    innhold?: string;
    journalfortAv?: string;
    journalfortDato?: string;
    kilde?: JournalpostKanal;
    kanal?: JournalpostKanal;
    mottattDato?: string;
    dokumentType?: DokumentType;
    journalforendeEnhet?: string;
    joarkJournalpostId?: string;
    journalstatus?: JournalStatus;
    feilfort?: boolean;
    brevkode?: KodeDto;
    journalpostId?: string;
    returDetaljer?: ReturDetaljerDto;
    distribuertTilAdresse?: DistribuerTilAdresse;
}

export interface ReturDetaljerDto {
    antall: number;
    dato?: string;
    logg: ReturDetaljerLoggDto[];
}

export interface ReturDetaljerLoggDto {
    beskrivelse: string;
    dato?: string;
    locked?: boolean;
}
export interface DokumentDto {
    dokumentreferanse?: string;
    journalpostId?: string;
    dokumentType?: DokumentType;
    tittel?: string;
    status?: string;
    dokument?: string;
}

interface AktorDto {
    ident: string;
    type: "AKTOERID" | "FNR";
}

export interface AvsenderMottakerDto {
    navn: string;
    ident: string;
    type: "ORGNR" | "FNR" | "UKJENT";
    adresse?: MottakerAdresseDto;
}

export interface MottakerAdresseDto {
    adresselinje1: string;
    adresselinje2: string;
    adresselinje3: string;
    bruksenhetsnummer: string;
    poststed: string;
    postnummer: string;
    landkode: string;
    landkode3: string;
}
interface KodeDto {
    kode?: string;
    dekode?: string;
    erGyldig: boolean;
}

export enum JournalpostKanal {
    SKAN_IM = "SKAN_IM",
    SKAN_BID = "SKAN_BID",
    NAV_NO_BID = "NAV_NO_BID",
    NAV_NO = "NAV_NO",
    SKAN_NETS = "SKAN_NETS",
    LOKAL_UTSKRIFT = "LOKAL_UTSKRIFT",
    INGEN_DISTRIBUSJON = "INGEN_DISTRIBUSJON",
    SENTRAL_UTSKRIFT = "SENTRAL_UTSKRIFT",
    SDP = "SDP",
}

export enum DokumentType {
    I = "I",
    U = "U",
    X = "X",
    N = "N",
}

export enum JournalStatus {
    AVSLUTTET = "A",
    UNDER_PRODUKSJON = "D",
    JOURNALFOERT = "J",
    FEILREGISTRERT = "F",
    EKSPEDERT_JOARK = "EJ",
    EKSPEDERT = "E",
    MOTTAT = "M",
    OPPRETTET = "O",
    RESERVERT = "R",
    TIL_LAGRING = "T",
    UTGAAR = "U",
    SLETTET = "S",
    RESKANNING_BESTILT = "AR",
    SPLITTING_BESTILT = "AS",
    FAGOMRAADE_ENDRET = "AF",
    FERDIGSTILT = "FS",
    KLAR_TIL_PRINT = "KP",
    RETUR = "RE",
}
