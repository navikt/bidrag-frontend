import { DokumentStatusDto, type JournalpostDto, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import { standardSort } from "../../sakshistorikk/components/journalpost/journalpostUtils";
import type { SaksDokument } from "../types";

export function sjekkOmBlandingAvFarOgBidrag(journalposter: JournalpostDto[]): boolean {
    const harFarskap = journalposter.some((jp) => jp.fagomrade === "FAR");
    const harBidrag = journalposter.some((jp) => jp.fagomrade === "BID");

    return harFarskap && harBidrag;
}

const erVedtak = (jp: JournalpostDto): boolean => {
    return jp.innhold?.toLowerCase().includes("vedtak") ?? false;
};

const harFerdigstiltDokument = (jp: JournalpostDto): boolean => {
    return (jp.dokumenter ?? []).some((dok) => dok.status === DokumentStatusDto.FERDIGSTILT);
};

export function filtrerJournalposter(
    journalposter: JournalpostDto[],
    kunVedtak: boolean,
    visFarskapUtelukket: boolean,
    visFeilregistrerte: boolean,
    kunFerdigstilte: boolean,
): JournalpostDto[] {
    return journalposter.filter((jp) => {
        const oppfyllerVedtakKrav = !kunVedtak || erVedtak(jp);
        const oppfyllerFarskapKrav = visFarskapUtelukket || jp.fagomrade !== "FAR";
        const oppfyllerFeilregistrertKrav = visFeilregistrerte || !jp.feilfort;
        const oppfyllerFerdigstiltKrav = !kunFerdigstilte || harFerdigstiltDokument(jp);

        return oppfyllerVedtakKrav && oppfyllerFarskapKrav && oppfyllerFeilregistrertKrav && oppfyllerFerdigstiltKrav;
    });
}

const genererJournalpostFallbackId = (jp: JournalpostDto): string => {
    return `${jp.journalfortDato ?? ""}-${jp.dokumentDato ?? ""}`;
};

export function hentJournalpostIderMedFlereDokumenter(journalposter: JournalpostDto[]): string[] {
    return journalposter
        .filter((jp) => (jp.dokumenter?.length ?? 0) > 0)
        .map((jp) => jp.journalpostId ?? genererJournalpostFallbackId(jp));
}

const genererSaksDokumentId = (
    journalpostId?: string | null,
    dokumentreferanse?: string | null,
    index?: number,
): string => {
    return `${journalpostId ?? "ukjent"}:${dokumentreferanse ?? index}`;
};

export function finnDokumenterForJournalpost(jp: JournalpostDto, alleDokumenter: SaksDokument[]): SaksDokument[] {
    const journalpostDokumenter = jp.dokumenter ?? [];

    return journalpostDokumenter
        .map((dok, index) => {
            const sokbarId = genererSaksDokumentId(jp.journalpostId, dok.dokumentreferanse, index);
            return alleDokumenter.find((d) => d.id === sokbarId);
        })
        .filter((d): d is SaksDokument => Boolean(d));
}

export function utvidSettMedNyVerdi(eksisterendeSett: Set<string>, nyVerdi: string): Set<string> {
    if (eksisterendeSett.has(nyVerdi)) {
        return eksisterendeSett;
    }
    return new Set(eksisterendeSett).add(nyVerdi);
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
    dokumentreferanse?: string | null,
): boolean {
    const harJournalpostId = Boolean(jp.journalpostId);
    const erFerdigstilt = dokumentStatus === DokumentStatusDto.FERDIGSTILT;
    const harGyldigReferanse = Boolean(dokumentreferanse || (jp.dokumenter?.length ?? 0) === 1);

    return harJournalpostId && erFerdigstilt && harGyldigReferanse;
}

const utledAarsakTilLukketDokument = (
    status?: DokumentStatusDto | null,
    dokumentreferanse?: string | null,
): string | undefined => {
    if (status === DokumentStatusDto.UNDER_PRODUKSJON) {
        return "Under produksjon";
    }
    if (!dokumentreferanse) {
        return "Mangler referanse";
    }
    return undefined;
};

const utledDokumentTittel = (tittel?: string | null, dokumentreferanse?: string | null, index?: number): string => {
    const rensetTittel = tittel?.trim();
    if (rensetTittel) {
        return rensetTittel;
    }
    if (dokumentreferanse) {
        return dokumentreferanse;
    }
    return `Dokument ${index !== undefined ? index + 1 : ""}`.trim();
};

export function byggDokumenter(journalposter: JournalpostDto[]): SaksDokument[] {
    return journalposter
        .slice()
        .sort(standardSort)
        .flatMap((jp) => {
            const journalpostDokumenter = jp.dokumenter ?? [];

            return journalpostDokumenter.map((dokument, index) => {
                const formatertId = genererSaksDokumentId(jp.journalpostId, dokument.dokumentreferanse, index);
                const tittel = utledDokumentTittel(dokument.tittel, dokument.dokumentreferanse, index);
                const kanAapnes = kanAapneDokument(jp, dokument.status, dokument.dokumentreferanse);
                const aapenForklaring = kanAapnes
                    ? undefined
                    : utledAarsakTilLukketDokument(dokument.status, dokument.dokumentreferanse);

                return {
                    id: formatertId,
                    journalpostId: jp.journalpostId ?? "",
                    journalpostStatus: jp.status ?? undefined,
                    journalpostTittel: jp.innhold ?? undefined,
                    journalfortDato: jp.journalfortDato ?? undefined,
                    dokumentreferanse: dokument.dokumentreferanse ?? undefined,
                    dokumentStatus: dokument.status ?? undefined,
                    dokumentType: jp.dokumentType ?? undefined,
                    dokumentDato: jp.dokumentDato ?? undefined,
                    tittel,
                    kanAapnes,
                    aapenForklaring,
                    gjelderAktor: jp.gjelderAktor,
                };
            });
        });
}
