import type { DokumentDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { EyeIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Detail, HStack, Label, Link, Loader, VStack } from "@navikt/ds-react";
import { useEffect, useMemo, useState } from "react";
import { useHentJournalpost } from "~/api/useApi.ts";
import { DomCachedPdfFremviser } from "~/common/dokument/DomCachedPdfFremviser";
import type { PdfDokument } from "~/common/dokument/PdfVisning";
import { JournalpostDetaljer } from "./JournalpostDetaljer";

interface JournalpostFremviserProps {
    journalpostId: string;
    dokumentreferanse?: string;
    hidden?: boolean;
    openInNewTab?: boolean;
    fallbackDokumentreferanser?: string[];
}

function getDocumentTitle(tittel?: string | null): string {
    if (tittel?.trim()) return tittel;
    return "Dokument uten tittel";
}

function formatSidebarLabel(tittel: string, index: number): string {
    return `${index + 1}. ${tittel}`;
}

function mapDokumenterToView(dokumenter: DokumentDto[] = [], fallbackJournalpostId: string): PdfDokument[] {
    const medReferanse = dokumenter.filter((dok) => Boolean(dok.dokumentreferanse));

    return medReferanse.map((dok) => {
        const kanÅpnes = dok.status !== DokumentStatusDto.UNDER_PRODUKSJON;

        return {
            tittel: getDocumentTitle(dok.tittel),
            journalpostId: dok.journalpostId ?? fallbackJournalpostId,
            dokumentreferanse: dok.dokumentreferanse as string,
            kanÅpnes,
            åpenForklaring: kanÅpnes ? undefined : "Under produksjon",
        };
    });
}

function generateFallbackDocuments(
    journalpostId: string,
    dokumentreferanse?: string,
    fallbackReferanser: string[] = [],
): PdfDokument[] {
    const unikeReferanser = Array.from(
        new Set([...(dokumentreferanse ? [dokumentreferanse] : []), ...fallbackReferanser]),
    );

    return unikeReferanser.map((referanse) => ({
        dokumentreferanse: referanse,
        journalpostId,
        tittel: getDocumentTitle(null),
        kanÅpnes: true,
    }));
}

function utledInitialValgtDokument(
    dokumenter: PdfDokument[],
    dokumentreferanse?: string,
    currentSelected?: string,
): string | undefined {
    const currentDoc = dokumenter.find((d) => d.dokumentreferanse === currentSelected);
    if (currentDoc?.kanÅpnes) return currentSelected;

    const requestedDoc = dokumenter.find((d) => d.dokumentreferanse === dokumentreferanse);
    if (requestedDoc?.kanÅpnes) return dokumentreferanse;

    return dokumenter.find((dok) => dok.kanÅpnes)?.dokumentreferanse;
}

function _utledBakgrunnsfarge(isSelected: boolean): string {
    if (isSelected) return "var(--a-surface-action-subtle)";
    return "transparent";
}

export default function JournalpostFremviser({
    journalpostId,
    dokumentreferanse,
    hidden,
    openInNewTab,
    fallbackDokumentreferanser = [],
}: JournalpostFremviserProps) {
    const [selectedValue, setSelectedValue] = useState<string>();
    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

    const {
        data: journalpostResponse,
        isLoading: isLoadingJournalpost,
        error: journalpostError,
    } = useHentJournalpost(journalpostId);

    const dokumenter = useMemo(() => {
        const apiDokumenter = mapDokumenterToView(journalpostResponse?.journalpost?.dokumenter, journalpostId);
        if (apiDokumenter.length > 0) return apiDokumenter;

        return generateFallbackDocuments(journalpostId, dokumentreferanse, fallbackDokumentreferanser);
    }, [dokumentreferanse, fallbackDokumentreferanser, journalpostId, journalpostResponse]);

    useEffect(() => {
        if (!selectedValue) return;
        setVisitedIds((prev) => new Set(prev).add(selectedValue));
    }, [selectedValue]);

    useEffect(() => {
        if (dokumenter.length === 0) {
            setSelectedValue(undefined);
            return;
        }
        setSelectedValue(utledInitialValgtDokument(dokumenter, dokumentreferanse, selectedValue));
    }, [dokumenter, dokumentreferanse, selectedValue]);

    if (hidden) return null;

    if (isLoadingJournalpost) {
        return (
            <VStack align="center" justify="center" style={{ height: "100vh" }}>
                <Loader size="3xlarge" title="Laster dokumentliste" />
            </VStack>
        );
    }

    if (journalpostError) throw journalpostError;
    if (dokumenter.length === 0) throw new Error(`Fant ingen dokumenter for journalpost ${journalpostId}`);

    const handleOpenMergedDocument = () => {
        const url = new URL(`/aapnedokument/${journalpostId}/${dokumentreferanse ?? ""}`, window.location.origin);
        if (openInNewTab) {
            window.open(url.toString(), "_blank");
            return;
        }
        window.location.assign(url.toString());
    };

    const velgDokument = (e: React.MouseEvent, referanse?: string) => {
        e.preventDefault();
        if (!referanse) return;
        setSelectedValue(referanse);
    };

    return (
        <HStack wrap={false} style={{ height: "100vh", overflow: "hidden" }}>
            <VStack as="nav" style={{ width: "21rem", minWidth: "16rem", maxWidth: "30em", overflow: "hidden" }}>
                <VStack gap="space-4" padding="space-4">
                    <JournalpostDetaljer journalpost={journalpostResponse?.journalpost} />

                    {dokumenter.length > 1 && (
                        <BodyShort size="small" textColor="subtle">
                            {dokumenter.length} dokumenter
                        </BodyShort>
                    )}

                    {dokumenter.length > 1 && (
                        <Button variant="secondary" size="xsmall" onClick={handleOpenMergedDocument}>
                            Åpne sammenslått
                        </Button>
                    )}
                </VStack>

                <VStack gap="space-2" padding="space-2" style={{ overflowY: "auto", flex: 1 }}>
                    {dokumenter.map((dokument, index) => {
                        const isVisited = dokument.dokumentreferanse
                            ? visitedIds.has(dokument.dokumentreferanse)
                            : false;

                        const innhold = (
                            <HStack
                                align="center"
                                gap="space-4"
                                justify="space-between"
                                style={{ width: "100%", padding: "var(--a-spacing-2) 0" }}
                            >
                                <VStack style={{ overflow: "hidden", flex: 1 }}>
                                    <Label
                                        size="small"
                                        textColor={!dokument.kanÅpnes ? "subtle" : "default"}
                                        style={{ wordBreak: "break-word" }}
                                    >
                                        {formatSidebarLabel(dokument.tittel, index)}
                                    </Label>
                                    {!dokument.kanÅpnes && (
                                        <Detail textColor="subtle">{dokument.åpenForklaring}</Detail>
                                    )}
                                </VStack>
                                {dokumenter.length > 1 && isVisited && (
                                    <EyeIcon title="Sett" style={{ flexShrink: 0, color: "var(--a-icon-subtle)" }} />
                                )}
                            </HStack>
                        );

                        if (!dokument.kanÅpnes) {
                            return <div key={dokument.dokumentreferanse}>{innhold}</div>;
                        }

                        return (
                            <Link
                                key={dokument.dokumentreferanse}
                                href="#"
                                onClick={(e) => velgDokument(e, dokument.dokumentreferanse)}
                            >
                                {innhold}
                            </Link>
                        );
                    })}
                </VStack>
            </VStack>

            <DomCachedPdfFremviser dokumenter={dokumenter} valgtDokumentreferanse={selectedValue} />
        </HStack>
    );
}
