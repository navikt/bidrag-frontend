import { DokumentStatus } from "../../constants/DokumentStatus";
import type { IDokument } from "../../types/Dokument";
import type { IDokumentJournalDto, IJournalpost } from "../../types/Journalpost";
import { isEqualIgnoreNull } from "../../utils/ObjectUtils";

export class JournalpostForsendelseRelasjoner {
    private journalpost: IJournalpost;
    private selectedDocuments: IDokument[];
    private forsendelseDokumenter: IDokument[];

    constructor(journalpost: IJournalpost, selectedDocuments: IDokument[], forsendelseDokumenter: IDokument[]) {
        this.journalpost = journalpost;
        this.selectedDocuments = selectedDocuments;
        this.forsendelseDokumenter = forsendelseDokumenter;
    }

    erNoenDokumenterValgt = () => this.journalpost.dokumenter.some(this.erDokumentValgt.bind(this));

    erAlleDokumenterValgt = (inkluderAlleredeLagtTilPåForsendelse = true) =>
        inkluderAlleredeLagtTilPåForsendelse
            ? this.journalpost.dokumenter.every(this.erDokumentValgt.bind(this))
            : this.journalpost.dokumenter.every(this.isDocumentSelectedNotIncludingAdded.bind(this));

    erJournalpostDokumenterLagtTilIForsendelse = () =>
        this.journalpost.dokumenter.some(this.erLagtTilIForsendelse.bind(this));

    erKopiAvEksternDokument(dokumentDto: IDokumentJournalDto) {
        return dokumentDto.originalDokumentreferanse != null || dokumentDto.originalJournalpostId != null;
    }

    getForsendelseStatus(dokumentDto: IDokumentJournalDto) {
        if (!this.journalpost.erForsendelse) {
            if (this.journalpost.journalpostId.startsWith("BID-")) {
                return this.journalpost.status === "UNDER_PRODUKSJON"
                    ? DokumentStatus.UNDER_PRODUKSJON
                    : DokumentStatus.FERDIGSTILT;
            }
            return DokumentStatus.FERDIGSTILT;
        }

        const kopiAvEksternDokument = this.erKopiAvEksternDokument(dokumentDto);
        const erLenkeTilAnnenForsendelse = dokumentDto.arkivSystem === "FORSENDELSE";
        if (dokumentDto.status === "FERDIGSTILT") {
            return kopiAvEksternDokument && !erLenkeTilAnnenForsendelse
                ? DokumentStatus.KONTROLLERT
                : DokumentStatus.FERDIGSTILT;
        }
        if (dokumentDto.status === "UNDER_PRODUKSJON") {
            return DokumentStatus.UNDER_PRODUKSJON;
        }
        return kopiAvEksternDokument && !erLenkeTilAnnenForsendelse
            ? DokumentStatus.MÅ_KONTROLLERES
            : DokumentStatus.UNDER_REDIGERING;
    }

    isJournalpostSelected() {
        return this.selectedDocuments.some(
            (d) => d.journalpostId === this.journalpost.journalpostId && d.dokumentreferanse === undefined,
        );
    }
    isDocumentSelectedNotIncludingAdded(dokument: IDokumentJournalDto) {
        return this.selectedDocuments.some((d) => isSameDocument(d, dokument));
    }

    erDokumentValgt(dokument: IDokumentJournalDto) {
        return (
            this.isDocumentSelectedNotIncludingAdded(dokument) ||
            this.erLagtTilIForsendelse(dokument) ||
            this.isJournalpostSelected() ||
            this.erJournalpostLagtTilIForsendelse()
        );
    }

    erJournalpostLagtTilIForsendelse() {
        return this.forsendelseDokumenter.some(
            (d) =>
                d.originalJournalpostId?.replace(/\D/g, "") === this.journalpost.journalpostId?.replace(/\D/g, "") &&
                d.originalDokumentreferanse === undefined,
        );
    }

    erAllDokumenterLagtTilIForsendelse() {
        return this.journalpost.dokumenter.every(this.erLagtTilIForsendelse.bind(this));
    }

    erLagtTilIForsendelse(dokument: IDokumentJournalDto) {
        return (
            this.forsendelseDokumenter.some((forsendelseDokument) => isSameDocument(forsendelseDokument, dokument)) ||
            this.erJournalpostLagtTilIForsendelse()
        );
    }
}

export function erSammeDokument(
    forsendelseDokument: IDokument,
    dokumentJournal: IDokumentJournalDto,
    journalpostId: string,
) {
    // const harReferanseTilDokumentIJournal =
    //     forsendelseDokument.lenkeTilDokumentreferanse == dokumentJournal.dokumentreferanse &&
    //     forsendelseDokument.forsendelseId === journalpostId?.replace(/\D/g, "");

    const erLenketTilEtAvDokumenteneIJournalpost =
        forsendelseDokument.originalDokumentreferanse == null &&
        forsendelseDokument.originalJournalpostId != null &&
        isEqualIgnoreNull(
            forsendelseDokument.originalJournalpostId,
            dokumentJournal.originalJournalpostId?.replace(/\D/g, ""),
        );
    const erLenketTilSammeDokument =
        isEqualIgnoreNull(forsendelseDokument.originalDokumentreferanse, dokumentJournal.originalDokumentreferanse) &&
        isEqualIgnoreNull(forsendelseDokument.originalJournalpostId, dokumentJournal.originalJournalpostId);

    const erDokumentIJournalLenketTilDokument =
        forsendelseDokument.dokumentreferanse === dokumentJournal.originalDokumentreferanse &&
        forsendelseDokument.forsendelseId === dokumentJournal.originalJournalpostId?.replace(/\D/g, "");

    const erForsendelseDokumentLenketTilDokumentIJournal =
        forsendelseDokument.originalDokumentreferanse === dokumentJournal.dokumentreferanse &&
        forsendelseDokument.originalJournalpostId?.replace(/\D/g, "") === journalpostId?.replace(/\D/g, "");

    return (
        // harReferanseTilDokumentIJournal ||
        erLenketTilEtAvDokumenteneIJournalpost ||
        erForsendelseDokumentLenketTilDokumentIJournal ||
        erLenketTilSammeDokument ||
        erDokumentIJournalLenketTilDokument
    );
}

export function isSameDocument(documentA: IDokument | IDokumentJournalDto, documentB: IDokument | IDokumentJournalDto) {
    const erReferanseTilSammeHeleJournalpost =
        (documentB.originalDokumentreferanse == null &&
            documentB.originalJournalpostId != null &&
            isEqualIgnoreNull(
                documentB.originalJournalpostId?.replace(/\D/g, ""),
                documentA.journalpostId?.replace(/\D/g, ""),
            )) ||
        (documentA.originalDokumentreferanse == null &&
            documentA.originalJournalpostId != null &&
            isEqualIgnoreNull(
                documentB.journalpostId?.replace(/\D/g, ""),
                documentA.originalJournalpostId?.replace(/\D/g, ""),
            )) ||
        (documentA.dokumentreferanse == null &&
            isEqualIgnoreNull(
                documentA.journalpostId?.replace(/\D/g, ""),
                documentB.originalJournalpostId?.replace(/\D/g, ""),
            ));
    const erReferanseTilSammeDokument =
        isEqualIgnoreNull(documentA.dokumentreferanse, documentB.originalDokumentreferanse) ||
        isEqualIgnoreNull(documentA.originalDokumentreferanse, documentB.originalDokumentreferanse) ||
        isEqualIgnoreNull(documentA.originalDokumentreferanse, documentB.dokumentreferanse);
    const erSammeDokument = documentA.dokumentreferanse === documentB.dokumentreferanse;

    return erSammeDokument || erReferanseTilSammeHeleJournalpost || erReferanseTilSammeDokument;
}
