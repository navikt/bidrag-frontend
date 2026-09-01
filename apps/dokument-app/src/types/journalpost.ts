import { type DokumentDto, type JournalpostDto, Kanal } from "../api/BidragDokumentApi";
import { formatDate } from "../common/utils/DateUtils";
import { isEmpty } from "../common/utils/ObjectUtils";
import {
    DokumentType,
    JournalpostKanal,
    JournalStatus,
    type ReturDetaljerDto,
    type ReturDetaljerLoggDto,
    type Sakstilknytning,
} from "./api/JournalpostTypes";
import { BaseDtoMapper } from "./common";

export const JOURNALPOST_TITLE_MAX_LENGTH = 200;
export { DokumentType, JournalpostKanal, JournalStatus };

export type ReturDetaljer = ReturDetaljerDto;
export type ReturDetaljerLogg = ReturDetaljerLoggDto;
export interface Journalpost extends JournalpostDto {
    sakstilknytninger: Sakstilknytning[];
    journalfortDatoDisplayValue: string;
    ekspedertDatoDisplayValue: string;
    journalpostIdNoPrefix: string;
    mottattDatoDisplayValue: string;
    kildeDisplayValue: string;
    dokumentTypeDisplayValue: string;
    journalStatusDisplayValue: string;
    isBidragJournalpost: boolean;
    isJoarkJournalpost: boolean;
    isForsendelse: boolean;
    isDigitalInnsendt: boolean;
    isStatusMottatt: boolean;
    isUtgaaende: boolean;
    isInngående: boolean;
    isTemaBidrag: boolean;
    isNotat: boolean;
    isKlarTilPrint: boolean;
    dokumenter: Dokument[];
}

export interface Dokument extends DokumentDto {
    dokumentOrder: number;
    tittelDisplayValue: string;
    dokumentLabel: string;
    dokumentLabelShort: string;
    isHoveddokument: boolean;
}

export interface DokumentRef {
    journalpostId: string;
    dokumentId: string;
}

export function dokumenterToString(journalpostId: string, dokumenter?: Dokument[]) {
    return dokumenter?.map((dokument) => dokumentToString(journalpostId, dokument));
}

export function dokumentToString(journalpostId: string, dokument: Dokument) {
    return `${journalpostId}:${dokument.dokumentreferanse}`;
}

export const JournalpostKildeDisplayValueMap: Map<Kanal, string> = new Map<Kanal, string>([
    [Kanal.NAV_NO, "Ditt NAV"],
    [Kanal.NAV_NO_BID, "Ditt NAV (innsending bidrag)"],
    [Kanal.SKAN_BID, "Skanning Bidrag"],
    [Kanal.SKAN_IM, "Skanning iron mountain"],
    [Kanal.SKAN_NETS, "Skanning Nets"],
    [Kanal.LOKAL_UTSKRIFT, "Lokal utskrift"],
    [Kanal.SENTRAL_UTSKRIFT, "Sentral print"],
    [Kanal.SDP, "Digital postkasse"],
    [Kanal.INGEN_DISTRIBUSJON, "Ingen distribusjon"],
]);

export const DokumentTypeDisplayValueMap: Map<DokumentType, string> = new Map<DokumentType, string>([
    [DokumentType.U, "Utgående"],
    [DokumentType.I, "Inngående"],
    [DokumentType.X, "Notat"],
    [DokumentType.N, "Notat"],
]);

export const JournalStatusDisplayValueMap: Map<JournalStatus, string> = new Map<JournalStatus, string>([
    [JournalStatus.AVSLUTTET, "Avsluttet"],
    [JournalStatus.UNDER_PRODUKSJON, "Under produksjon"],
    [JournalStatus.JOURNALFOERT, "Journalført"],
    [JournalStatus.FEILREGISTRERT, "Feilregistrert"],
    [JournalStatus.EKSPEDERT, "Ekspedert"],
    [JournalStatus.EKSPEDERT_JOARK, "Ekspedert"],
    [JournalStatus.FERDIGSTILT, "Ferdigstilt"],
    [JournalStatus.MOTTAT, "Mottaksreg."],
    [JournalStatus.RESERVERT, "Reservert"],
    [JournalStatus.TIL_LAGRING, "Til lagring"],
    [JournalStatus.UTGAAR, "Utgår"],
    [JournalStatus.SLETTET, "Slettet"],
    [JournalStatus.RESKANNING_BESTILT, "Reskanning bestilt"],
    [JournalStatus.SPLITTING_BESTILT, "Splitting bestilt"],
    [JournalStatus.FAGOMRAADE_ENDRET, "Fagområde endret"],
    [JournalStatus.KLAR_TIL_PRINT, "Klar til print"],
    [JournalStatus.RETUR, "Retur"],
]);

export class JournalpostMapper extends BaseDtoMapper<Journalpost> {
    journalpostDto: JournalpostDto;
    journalpostId: string;
    sakstilknytninger: Sakstilknytning[];
    saksnummer: string;
    constructor(journalpostDto: JournalpostDto, saksnummer?: string, sakstilknytninger: Sakstilknytning[] = []) {
        super();
        this.journalpostDto = journalpostDto;
        this.saksnummer = saksnummer;
        this.journalpostId = journalpostDto.journalpostId;
        this.sakstilknytninger = sakstilknytninger;
    }

    map(): Journalpost {
        const journalStatus = this.convertJoarkJournalstatus(this.journalpostDto.journalstatus);
        return {
            ...this.journalpostDto,
            journalpostIdNoPrefix: this.journalpostIdNoPrefix(),
            journalstatus: journalStatus,
            isKlarTilPrint: journalStatus === JournalStatus.KLAR_TIL_PRINT,
            isTemaBidrag: this.journalpostDto?.fagomrade === "BID" || this.journalpostDto?.fagomrade === "FAR",
            isStatusMottatt: this.isStatusMottatt(),
            isJoarkJournalpost: this.isJoarkJournalpost(),
            isBidragJournalpost: this.isBidragJournalpost(),
            isForsendelse: this.isForsendelse(),
            isDigitalInnsendt: this.isDigitalInnsendt(),
            isUtgaaende: this.isUtgaaende(),
            isInngående: this.isInngaaende(),
            journalfortDatoDisplayValue: this.journalfortDatoDisplayValue(),
            ekspedertDatoDisplayValue: this.ekspedertDatoDisplayValue(),
            journalStatusDisplayValue: this.journalStatusDisplayValue(journalStatus),
            mottattDatoDisplayValue: this.mottattDatoDisplayValue(),
            kildeDisplayValue: this.kildeDisplayValue(),
            dokumentTypeDisplayValue: this.dokumentTypeDisplayValue(),
            sakstilknytninger: this.sakstilknytninger,
            isNotat: this.isNotat(),
            innhold: this.isJoarkJournalpost() ? this.hoveddokument()?.tittel : this.journalpostDto.innhold,
            dokumenter: this.journalpostDto.dokumenter?.map(this.mapDokument) ?? [],
        };
    }

    mappedDokumenter() {
        return this.journalpostDto.dokumenter?.map(this.mapDokument) ?? [];
    }
    hoveddokument() {
        return this.journalpostDto.dokumenter?.map(this.mapDokument)[0];
    }
    journalpostIdNoPrefix() {
        return this.journalpostDto.journalpostId?.replace("BID-", "")?.replace("JOARK-", "");
    }

    ekspedertDatoDisplayValue() {
        return formatDate(this.journalpostDto.ekspedertDato);
    }

    journalfortDatoDisplayValue() {
        return formatDate(this.journalpostDto.journalfortDato);
    }

    mapDokument = (dokumentDto: DokumentDto, index: number) =>
        new DokumentMapper(dokumentDto, this.journalpostDto.innhold, index).map();

    mottattDatoDisplayValue() {
        const date =
            this.isJoarkJournalpost() && this.isInngaaende()
                ? this.journalpostDto.mottattDato
                : this.journalpostDto.dokumentDato;
        return formatDate(date);
    }

    journalStatusDisplayValue(journalStatus: JournalStatus) {
        const journalStatusDisplayValue = JournalStatusDisplayValueMap.get(journalStatus);
        if (!journalStatusDisplayValue && this.isJoarkJournalpost()) {
            const status = this.journalpostDto.journalstatus?.replace("_", " ").toLowerCase();
            return status.substring(0, 1).toUpperCase() + status.substring(1, status.length);
        }
        return journalStatusDisplayValue;
    }

    isDigitalInnsendt() {
        return this.journalpostDto.kanal === Kanal.NAV_NO_BID || this.journalpostDto.kanal === Kanal.NAV_NO;
    }
    kildeDisplayValue() {
        if (this.journalpostDto.kanal === Kanal.INGEN_DISTRIBUSJON) {
            return JournalpostKildeDisplayValueMap.get(this.journalpostDto.kanal);
        }

        if (this.isUtgaaende() && !this.isStatusEkspedert()) {
            return null;
        }

        if (isEmpty(this.journalpostDto.kanal)) {
            return null;
        }
        return JournalpostKildeDisplayValueMap.get(this.journalpostDto.kanal);
    }

    dokumentTypeDisplayValue() {
        return DokumentTypeDisplayValueMap.get(this.journalpostDto.dokumentType as DokumentType);
    }

    isInngaaende() {
        return this.journalpostDto?.dokumentType === DokumentType.I;
    }

    isUtgaaende() {
        return this.journalpostDto?.dokumentType === DokumentType.U;
    }

    isNotat() {
        return (
            this.journalpostDto?.dokumentType === DokumentType.X || this.journalpostDto?.dokumentType === DokumentType.N
        );
    }

    isStatusEkspedert() {
        return (
            this.journalpostDto.journalstatus === JournalStatus.EKSPEDERT ||
            this.journalpostDto.journalstatus === JournalStatus.RETUR
        );
    }

    isStatusMottatt() {
        return this.journalpostDto.journalstatus === JournalStatus.MOTTAT;
    }
    isBidragJournalpost() {
        return this.journalpostId?.includes("BID");
    }
    isJoarkJournalpost() {
        return this.journalpostId?.includes("JOARK");
    }

    isForsendelse() {
        return this.journalpostId?.includes("BIF");
    }

    private convertJoarkJournalstatus(joarkJournalStatus: string): JournalStatus {
        switch (joarkJournalStatus) {
            case "MOTTATT":
                return JournalStatus.MOTTAT;
            case "JOURNALFOERT":
                return JournalStatus.JOURNALFOERT;
            case "FERDIGSTILT":
                return JournalStatus.FERDIGSTILT;
            case "UTGAAR":
                return JournalStatus.UTGAAR;
            case "AVBRUTT":
                return JournalStatus.AVSLUTTET;
            case "UNDER_ARBEID":
                return JournalStatus.UNDER_PRODUKSJON;
            case "RESERVERT":
                return JournalStatus.RESERVERT;
            case "OPPLASTING_DOKUMENT":
            case "EKSPEDERT":
            case "UKJENT_BRUKER":
            case "FEILREGISTRERT":
            default:
                return joarkJournalStatus as JournalStatus;
        }
    }
}

export class DokumentMapper extends BaseDtoMapper<Dokument> {
    dokumentDto: DokumentDto;
    dokumentOrder: number;
    journalpostTittel: string;
    constructor(dokumentDto: DokumentDto, journalpostTittel = "", dokumentOrder = 0) {
        super();
        this.dokumentDto = dokumentDto;
        this.dokumentOrder = dokumentOrder;
        this.journalpostTittel = journalpostTittel;
    }

    map(): Dokument {
        return {
            ...this.dokumentDto,
            tittelDisplayValue: this.tittelDisplayValue(),
            dokumentLabel: this.dokumentLabel(),
            dokumentLabelShort: this.dokumentLabelShort(),
            isHoveddokument: this.isHoveddokument(),
            dokumentOrder: this.dokumentOrder,
        };
    }

    tittelDisplayValue() {
        if (isEmpty(this.dokumentDto.tittel) && this.isHoveddokument()) {
            return isEmpty(this.journalpostTittel) ? "Hoveddokument" : this.journalpostTittel;
        }
        if (isEmpty(this.dokumentDto.tittel) && !this.isHoveddokument()) {
            return `Vedlegg ${this.dokumentOrder + 1}`;
        }
        return this.dokumentDto.tittel;
    }

    dokumentLabelShort() {
        const maxLength = 40;
        const tittel = this.tittelDisplayValue();
        return `${tittel.length > maxLength ? tittel.substring(0, maxLength) + "..." : tittel} (${
            this.dokumentDto.dokumentreferanse
        })`;
    }

    dokumentLabel() {
        return `${this.tittelDisplayValue()} (${this.dokumentDto.dokumentreferanse})`;
    }

    isHoveddokument(): boolean {
        return this.dokumentOrder === 0;
    }
}

export function getErrorMessageWhenJournalpostStatusIsNotMottatt(journalpost: Journalpost): string {
    if (journalpost.isStatusMottatt) {
        return;
    }
    let message = ``;
    // let message = `Journalpost ${journalpost.journalpostId} er ikke tilgjengelig. `;
    switch (journalpost.journalstatus) {
        case JournalStatus.JOURNALFOERT:
            message += "Journalposten er journalført";
            break;
        case JournalStatus.SLETTET:
            message += "Journalposten er slettet";
            break;
        case JournalStatus.RESKANNING_BESTILT:
            message += "Det har blitt bestilt reskanning av journalposten gjennom avviksrutinen";
            break;
        case JournalStatus.SPLITTING_BESTILT:
            message += "Det har blitt bestilt splitting av journalposten gjennom avviksrutinen";
            break;
        case JournalStatus.UTGAAR:
            message += "Journalposten er trukket gjennom avviksrutinen";
            break;
        case JournalStatus.FAGOMRAADE_ENDRET:
            message += `Fagområde på journalposten er endret til ${journalpost.fagomrade}, dvs. noe annet enn Bidrag eller Farskap gjennom avviksrutinen`;
            break;
        case JournalStatus.AVSLUTTET:
            message += `Journalpost er avsluttet`;
            break;
        case JournalStatus.OPPRETTET:
            message += `Journalpost er opprettet`;
            break;
        case JournalStatus.RESERVERT:
            message += `Journalpost er reservert`;
            break;
        case JournalStatus.TIL_LAGRING:
            message += `Journalpost er sendt til lagring`;
            break;
        case JournalStatus.UNDER_PRODUKSJON:
            message += `Journalpost er under produksjon`;
            break;
        default:
            message += `Journalpost har status ${journalpost.journalstatus}`;
    }
    return message + ".";
}
