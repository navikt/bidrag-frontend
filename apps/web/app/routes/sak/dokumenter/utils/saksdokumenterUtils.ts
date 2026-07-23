import { DokumentStatusDto, type JournalpostDto, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import { standardSort } from "../../sakshistorikk/components/journalpost/journalpostUtils";
import type { SaksDokument } from "../types";

export function sjekkOmBlandingAvFarOgBidrag(journalposter: JournalpostDto[]): boolean {
    const harFar = journalposter.some((jp) => jp.fagomrade === "FAR");
    const harBid = journalposter.some((jp) => jp.fagomrade === "BID");
    return harFar && harBid;
}

export function filtrerJournalposter(
    journalposter: JournalpostDto[],
    kunVedtak: boolean,
    visFarskapUtelukket: boolean,
    visFeilregistrerte: boolean,
    kunFerdigstilte: boolean,
): JournalpostDto[] {
    return journalposter.filter((jp) => {
        const tekstinnhold = jp.innhold?.toLowerCase() ?? "";
        const erIkkeVedtak = kunVedtak && !tekstinnhold.includes("vedtak");
        const erSkjultFarskap = !visFarskapUtelukket && jp.fagomrade === "FAR";
        const erSkjultFeilregistrert = !visFeilregistrerte && jp.feilfort;

        const harFerdigstiltDokument = (jp.dokumenter ?? []).some(
            (dok) => dok.status === DokumentStatusDto.FERDIGSTILT,
        );
        const erSkjultIkkeFerdigstilt = kunFerdigstilte && !harFerdigstiltDokument;

        return !(erIkkeVedtak || erSkjultFarskap || erSkjultFeilregistrert || erSkjultIkkeFerdigstilt);
    });
}

export function hentJournalpostIderMedFlereDokumenter(journalposter: JournalpostDto[]): string[] {
    return journalposter
        .filter((jp) => (jp.dokumenter?.length ?? 0) > 1)
        .map((jp) => jp.journalpostId ?? `${jp.journalfortDato ?? ""}-${jp.dokumentDato ?? ""}`);
}

export function finnDokumenterForJournalpost(jp: JournalpostDto, dokumenter: SaksDokument[]): SaksDokument[] {
    const journalpostDokumenter = jp.dokumenter ?? [];
    return journalpostDokumenter
        .map((dok, index) => {
            const idForSok = `${jp.journalpostId ?? "ukjent"}:${dok.dokumentreferanse ?? index}`;
            return dokumenter.find((d) => d.id === idForSok);
        })
        .filter((d): d is SaksDokument => Boolean(d));
}

export function utvidSettMedNyVerdi(prevSett: Set<string>, nyVerdi: string): Set<string> {
    if (prevSett.has(nyVerdi)) {
        return prevSett;
    }
    const nyttSett = new Set(prevSett);
    nyttSett.add(nyVerdi);
    return nyttSett;
}

export function journalpostStatusForkortelse(status?: JournalpostStatus | null): string {
    switch (status) {
        case JournalpostStatus.FERDIGSTILT:
            return "F";
        case JournalpostStatus.UNDER_PRODUKSJON:
            return "P";
        case JournalpostStatus.UNDER_OPPRETTELSE:
            return "U";
        case JournalpostStatus.KLAR_FOR_DISTRIBUSJON:
            return "K";
        case JournalpostStatus.FEILREGISTRERT:
            return "X";
        case JournalpostStatus.RETUR:
            return "R";
        default:
            return status ? status.charAt(0).toUpperCase() : "-";
    }
}

export function kanAapneDokument(
    jp: JournalpostDto,
    dokumentStatus?: DokumentStatusDto | null,
    dokumentreferanse?: string,
): boolean {
    const harJournalpost = Boolean(jp.journalpostId);
    const erFerdigstilt = dokumentStatus === DokumentStatusDto.FERDIGSTILT;
    const harReferanseEllerKunEttDokument = Boolean(dokumentreferanse || (jp.dokumenter?.length ?? 0) === 1);

    return harJournalpost && erFerdigstilt && harReferanseEllerKunEttDokument;
}

export function byggDokumenter(journalposter: JournalpostDto[]): SaksDokument[] {
    return journalposter
        .slice()
        .sort(standardSort)
        .flatMap((jp) => {
            const innhold = jp.dokumenter ?? [];
            return innhold.map((dokument, index) => {
                const dokumentRef = dokument.dokumentreferanse ?? undefined;
                const kanAapnes = kanAapneDokument(jp, dokument.status, dokumentRef);

                const erUnderProduksjon = dokument.status === DokumentStatusDto.UNDER_PRODUKSJON;
                const manglerReferanse = !dokument.dokumentreferanse;
                const fallbackForklaring = erUnderProduksjon
                    ? "Under produksjon"
                    : manglerReferanse
                      ? "Mangler referanse"
                      : undefined;

                const standardTittel = `Dokument ${index + 1}`;
                const formatertTittel = dokument.tittel?.trim() || dokument.dokumentreferanse || standardTittel;
                const formatertId = `${jp.journalpostId ?? "ukjent"}:${dokumentRef ?? index}`;

                return {
                    id: formatertId,
                    journalpostId: jp.journalpostId ?? "",
                    journalpostStatus: jp.status ?? undefined,
                    journalpostTittel: jp.innhold ?? undefined,
                    journalfortDato: jp.journalfortDato ?? undefined,
                    dokumentreferanse: dokumentRef,
                    dokumentStatus: dokument.status ?? undefined,
                    dokumentType: jp.dokumentType ?? undefined,
                    dokumentDato: jp.dokumentDato ?? undefined,
                    tittel: formatertTittel,
                    kanAapnes,
                    aapenForklaring: kanAapnes ? undefined : fallbackForklaring,
                    gjelderAktor: jp.gjelderAktor,
                };
            });
        });
}
