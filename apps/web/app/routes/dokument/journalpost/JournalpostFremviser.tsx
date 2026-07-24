import type { DokumentDto } from "@bidrag/api/BidragDokumentApi";
import { DokumentStatusDto } from "@bidrag/api/BidragDokumentApi";
import { EyeIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Detail, HStack, Label, Link, Loader, VStack } from "@navikt/ds-react";
import { useEffect, useMemo, useState } from "react";
import { hentDokumentApi, useHentJournalpost } from "~/api/useApi.ts";
import { DomCachedPdfFremviser } from "~/common/dokument/DomCachedPdfFremviser";
import { JournalpostMetadata } from "~/common/dokument/JournalpostMetadata";
import type { PdfDokument } from "~/common/dokument/PdfVisning";
import { JournalpostDetaljer } from "./JournalpostDetaljer";

interface JournalpostFremviserProps {
    journalpostId: string;
    dokumentreferanse?: string;
    hidden?: boolean;
    openInNewTab?: boolean;
    fallbackDokumentreferanser?: string[];
}

function utledDokumentTittel(tittel?: string | null): string {
    if (tittel?.trim()) return tittel;
    return "Dokument uten tittel";
}

function formaterSidelinjeTittel(tittel: string, index: number): string {
    return `${index + 1}. ${tittel}`;
}

function mapDokumenterToView(dokumenter: DokumentDto[] = [], fallbackJournalpostId: string): PdfDokument[] {
    const medReferanse = dokumenter.filter((dok) => Boolean(dok.dokumentreferanse));

    return medReferanse.map((dok) => {
        const kanÅpnes = dok.status !== DokumentStatusDto.UNDER_PRODUKSJON;

        return {
            tittel: utledDokumentTittel(dok.tittel),
            journalpostId: dok.journalpostId ?? fallbackJournalpostId,
            dokumentreferanse: dok.dokumentreferanse as string,
            kanÅpnes,
            åpenForklaring: kanÅpnes ? undefined : "Under produksjon",
        };
    });
}

function genererFallbackDokumenter(
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
        tittel: utledDokumentTittel(null),
        kanÅpnes: true,
    }));
}

function utledStartValgtDokument(
    dokumenter: PdfDokument[],
    dokumentreferanse?: string,
    noevaerendeValgt?: string,
): string | undefined {
    const finnesINåværende = dokumenter.find((d) => d.dokumentreferanse === noevaerendeValgt);
    if (finnesINåværende?.kanÅpnes) return noevaerendeValgt;

    const finnesIOppgitt = dokumenter.find((d) => d.dokumentreferanse === dokumentreferanse);
    if (finnesIOppgitt?.kanÅpnes) return dokumentreferanse;

    return dokumenter.find((dok) => dok.kanÅpnes)?.dokumentreferanse;
}

export default function JournalpostFremviser({
    journalpostId,
    dokumentreferanse,
    hidden,
    fallbackDokumentreferanser = [],
}: JournalpostFremviserProps) {
    const [selectedValue, setSelectedValue] = useState<string>();
    const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

    const { data, isLoading: isLoadingJournalpost, error: journalpostError } = useHentJournalpost(journalpostId);

    const dokumenter = useMemo(() => {
        const apiDokumenter = mapDokumenterToView(data?.journalpost?.dokumenter, journalpostId);
        if (apiDokumenter.length > 0) return apiDokumenter;

        return genererFallbackDokumenter(journalpostId, dokumentreferanse, fallbackDokumentreferanser);
    }, [dokumentreferanse, fallbackDokumentreferanser, journalpostId, data]);

    useEffect(() => {
        if (!selectedValue) return;
        setVisitedIds((prev) => new Set(prev).add(selectedValue));
    }, [selectedValue]);

    useEffect(() => {
        if (dokumenter.length === 0) {
            setSelectedValue(undefined);
            return;
        }
        setSelectedValue(utledStartValgtDokument(dokumenter, dokumentreferanse, selectedValue));
    }, [dokumenter, dokumentreferanse, selectedValue]);

    if (isLoadingJournalpost) {
        return (
            <VStack align="center" justify="center" style={{ height: "100vh" }}>
                <Loader size="3xlarge" title="Laster dokumentliste" />
            </VStack>
        );
    }

    if (journalpostError) throw journalpostError;

    if (!data?.journalpost) {
        return null;
    }

    const journalpost = data.journalpost;

    if (dokumenter.length === 0) {
        throw new Error(`Fant ingen dokumenter for journalpost ${journalpostId}`);
    }

    if (hidden) return null;

    async function opneSammenslattPdf(journalpostId: string) {
        const nyFane = window.open("", "_blank");
        if (!nyFane) return;

        try {
            const arrayBuffer = await hentDokumentApi({ journalpostId });
            const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });
            nyFane.location.href = URL.createObjectURL(pdfBlob);
        } catch {
            nyFane.close();
        }
    }

    <Button variant="secondary" size="xsmall" onClick={() => opneSammenslattPdf(journalpostId)}>
        Åpne sammenslått
    </Button>;

    const velgDokument = (e: React.MouseEvent, referanse?: string) => {
        e.preventDefault();
        if (!referanse) return;
        setSelectedValue(referanse);
    };

    return (
        <HStack wrap={false} style={{ height: "100vh", overflow: "hidden" }}>
            <VStack as="nav" style={{ width: "21rem", minWidth: "16rem", maxWidth: "30em", overflow: "hidden" }}>
                <VStack gap="space-4" padding="space-4">
                    <JournalpostDetaljer journalpost={journalpost} />
                    <JournalpostMetadata jp={journalpost} visFagomrade={false} />
                    {dokumenter.length > 1 && (
                        <Button variant="secondary" size="xsmall" onClick={() => opneSammenslattPdf(journalpostId)}>
                            Åpne sammenslått
                        </Button>
                    )}
                    {dokumenter.length > 1 && (
                        <BodyShort size="small" textColor="subtle">
                            {dokumenter.length} dokumenter
                        </BodyShort>
                    )}
                </VStack>

                <VStack gap="space-12" padding="space-2" style={{ overflowY: "auto", flex: 1 }}>
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
                                        {formaterSidelinjeTittel(dokument.tittel, index)}
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
