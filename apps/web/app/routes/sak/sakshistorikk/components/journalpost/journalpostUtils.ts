import type {
    JournalpostDto,
    JournalpostStatus,
    Kanal,
} from "@bidrag/api/BidragDokumentApi";
import {
    JournalpostStatus as JournalpostStatusEnum,
    Kanal as KanalEnum,
} from "@bidrag/api/BidragDokumentApi";

export const DIGITALE_KANALER: Kanal[] = [
    KanalEnum.SDP,
    KanalEnum.NAV_NO,
    KanalEnum.NAV_NO_BID,
    KanalEnum.NAV_NO_UINNLOGGET,
    KanalEnum.NAV_NO_CHAT,
];

export const EKSPEDERT_STATUSER: JournalpostStatus[] = [
    JournalpostStatusEnum.EKSPEDERT,
    JournalpostStatusEnum.EKSPEDERT_JOARK,
    JournalpostStatusEnum.DISTRIBUERT,
];

export function journalstatusDisplayVerdi(jp: JournalpostDto): string {
    const status = jp.status;
    const kanal = jp.kanal ?? jp.kilde;
    const erNotat = jp.dokumentType === "X";

    if (status === JournalpostStatusEnum.RETUR) return "Retur";
    if (status === JournalpostStatusEnum.FEILREGISTRERT)
        return "Feilregistrert";
    if (kanal === KanalEnum.INGEN_DISTRIBUSJON && !erNotat)
        return "Ingen distribusjon";

    if (status && EKSPEDERT_STATUSER.includes(status) && kanal) {
        if (kanal === KanalEnum.SENTRAL_UTSKRIFT) return "Sendt sentralt";
        if (kanal === KanalEnum.LOKAL_UTSKRIFT) return "Sendt lokalt";
        if (DIGITALE_KANALER.includes(kanal)) return "Sendt digitalt";
    }

    if (status === JournalpostStatusEnum.UNDER_PRODUKSJON)
        return "Under produksjon";
    if (status === JournalpostStatusEnum.UNDER_OPPRETTELSE)
        return "Under opprettelse";
    if (status === JournalpostStatusEnum.RESERVERT) return "Reservert";
    if (status === JournalpostStatusEnum.KLAR_FOR_DISTRIBUSJON)
        return "Klar for distribusjon";
    if (status === JournalpostStatusEnum.JOURNALFORT) return "Journalført";
    if (status === JournalpostStatusEnum.MOTTATT) return "Mottatt";
    if (status === JournalpostStatusEnum.MOTTAKSREGISTRERT)
        return "Mottaksregistrert";
    if (status === JournalpostStatusEnum.FERDIGSTILT) return "Ferdigstilt";
    if (status === JournalpostStatusEnum.AVBRUTT) return "Avbrutt";

    return status ?? "-";
}

export function standardSort(a: JournalpostDto, b: JournalpostDto): number {
    const klarTilPrint = (jp: JournalpostDto) =>
        jp.status === JournalpostStatusEnum.KLAR_FOR_DISTRIBUSJON;
    const underOpprettelse = (jp: JournalpostDto) =>
        jp.status === JournalpostStatusEnum.UNDER_OPPRETTELSE;
    const erForsendelse = (jp: JournalpostDto) =>
        jp.status === JournalpostStatusEnum.UNDER_PRODUKSJON ||
        (jp.journalpostId?.startsWith("BID-") ?? false);

    return (
        Number(klarTilPrint(b)) - Number(klarTilPrint(a)) ||
        Number(underOpprettelse(b)) - Number(underOpprettelse(a)) ||
        Number(erForsendelse(b)) - Number(erForsendelse(a)) ||
        (b.dokumentDato ?? "").localeCompare(a.dokumentDato ?? "") ||
        (b.journalpostId ?? "").localeCompare(a.journalpostId ?? "")
    );
}
