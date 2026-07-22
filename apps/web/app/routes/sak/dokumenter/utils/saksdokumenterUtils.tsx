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

export function estimatePageCountFromArrayBuffer(file: ArrayBuffer): number | undefined {
    try {
        const decodedString = new TextDecoder("latin1").decode(file);
        const matchResultat = decodedString.match(/\/Type\s*\/Page\b/g);
        return matchResultat?.length;
    } catch {
        return undefined;
    }
}

export function isLikelyBase64(value: string): boolean {
    const normalized = value.replace(/\s/g, "");
    if (normalized.length < 16 || normalized.length % 4 !== 0) {
        return false;
    }
    return /^[A-Za-z0-9+/=]+$/.test(normalized);
}

export function toPdfSource(response: unknown): { src?: string; pageBuffer?: ArrayBuffer; isBlobUrl: boolean } {
    if (response instanceof ArrayBuffer) {
        const kilde = URL.createObjectURL(new Blob([response], { type: "application/pdf" }));
        return { src: kilde, pageBuffer: response, isBlobUrl: true };
    }
    if (response instanceof Uint8Array) {
        const pageBuffer = response.buffer instanceof ArrayBuffer ? response.buffer : undefined;
        // Castes til BlobPart for å fortelle TypeScript at Uint8Array-en er trygg å sende til Blob
        const kilde = URL.createObjectURL(new Blob([response as unknown as BlobPart], { type: "application/pdf" }));
        return { src: kilde, pageBuffer, isBlobUrl: true };
    }
    if (response instanceof Blob) {
        const kilde = URL.createObjectURL(response);
        return { src: kilde, isBlobUrl: true };
    }
    if (typeof response === "string") {
        const verdi = response.trim();
        if (!verdi) {
            return { isBlobUrl: false };
        }

        const erStandardUrlEllerDataUrl =
            verdi.startsWith("data:application/pdf") ||
            verdi.startsWith("blob:") ||
            verdi.startsWith("http") ||
            verdi.startsWith("https");
        if (erStandardUrlEllerDataUrl) {
            return { src: verdi, isBlobUrl: false };
        }

        const erRaaBase64 = verdi.startsWith("JVBER") || isLikelyBase64(verdi);
        if (erRaaBase64) {
            const formatertBase64 = `data:application/pdf;base64,${verdi.replace(/\s/g, "")}`;
            return { src: formatertBase64, isBlobUrl: false };
        }
    }
    return { isBlobUrl: false };
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
