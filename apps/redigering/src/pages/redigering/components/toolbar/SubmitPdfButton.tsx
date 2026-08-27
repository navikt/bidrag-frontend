import { LoggerService } from "@bidrag/common";
import { FileCheckmarkIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Button, Modal } from "@navikt/ds-react";
import React, { useState } from "react";

import { usePdfEditorContext } from "../PdfEditorContext";
import ProduceDocumentStateIndicator from "./ProduceDocumentStateIndicator";

function formatPageNumbers(pages: number[]): string {
    if (pages.length === 0) {
        return "Ingen";
    }

    const ranges: string[] = [];
    let rangeStart = pages[0];
    let previousPage = pages[0];

    for (let index = 1; index < pages.length; index++) {
        const page = pages[index];

        if (page === previousPage + 1) {
            previousPage = page;
            continue;
        }

        ranges.push(rangeStart === previousPage ? `${rangeStart}` : `${rangeStart}-${previousPage}`);
        rangeStart = page;
        previousPage = page;
    }

    ranges.push(rangeStart === previousPage ? `${rangeStart}` : `${rangeStart}-${previousPage}`);

    return ranges.join(", ");
}

function formatMaskedPages(maskedPages: number[]): string {
    if (maskedPages.length === 0) {
        return "Ingen";
    }

    return formatPageNumbers(maskedPages);
}

function formatRotatedPages(rotatedPages: number[]): string {
    if (rotatedPages.length === 0) {
        return "Ingen";
    }

    return formatPageNumbers(rotatedPages);
}

export default function SubmitPdfButton() {
    const {
        finishPdf,
        previewPdf,
        previewOriginalPdf,
        dokumentreferanse,
        forsendelseId,
        removedPages,
        maskedPagesCount,
        maskedPageNumbers,
        pageRotations,
        totalPages,
    } = usePdfEditorContext();
    const [producingDocument, setProducingDocument] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string>();
    const rotatedPagesCount = Object.keys(pageRotations).length;
    const remainingPages = totalPages > -1 ? totalPages - removedPages.length : undefined;
    const sortedRemovedPages = [...removedPages].sort((a, b) => a - b);
    const sortedMaskedPages = [...maskedPageNumbers].sort((a, b) => a - b);
    const sortedRotatedPages = Object.keys(pageRotations)
        .map(Number)
        .sort((a, b) => a - b);

    async function _producePdf() {
        setProducingDocument(true);

        await finishPdf()
            .finally(() => {
                setProducingDocument(false);
            })
            .then(closeModal)
            .catch((error) => {
                LoggerService.error(
                    `Det skjedde en feil ved produsering av dokument ${dokumentreferanse} i forsendelse ${forsendelseId}`,
                    error,
                );
                if (typeof error == "string") {
                    setSubmitError(error ?? "ukjent feil");
                } else {
                    setSubmitError(error?.message ?? "ukjent feil");
                }
            });
    }

    const openModal = () => {
        setSubmitError(undefined);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
    };

    const openOriginalPreview = async () => {
        await previewOriginalPdf();
    };

    const openEditedPreview = async () => {
        await previewPdf();
    };

    return (
        <>
            <Button
                loading={producingDocument}
                size={"small"}
                onClick={openModal}
                variant={"primary"}
                icon={<FileCheckmarkIcon />}
            >
                Ferdigstill
            </Button>
            {modalOpen && (
                <Modal
                    open
                    onClose={closeModal}
                    closeOnBackdropClick
                    width={820}
                    portal
                    header={{
                        heading: "Er du ferdig med å kontrollere dokumentet?",
                        closeButton: true,
                    }}
                >
                    <Modal.Body>
                        <BodyShort spacing>
                            Velger du å ferdigstille dokumentet vil redigert dokument lagres og status på dokumentet bli
                            satt til "KONTROLLERT". Det er mulig å låse opp for redigering senere hvis du ombestemmer
                            deg.
                        </BodyShort>
                        <Alert variant="warning" size="small" className="w-max">
                            Før du ferdigstiller er det viktig at du har sett gjennom HELE dokumentet og "slettet"
                            sensitiv informasjon som mottaker ikke skal ha innsyn på.
                        </Alert>

                        <div className="mt-3 mb-3 p-3 rounded border border-ax-border-neutral-subtle bg-ax-bg-neutral-soft">
                            <BodyShort spacing>
                                Oppsummering av endringer:{" "}
                                {remainingPages !== undefined
                                    ? `${remainingPages} sider gjenstår av ${totalPages}.`
                                    : "Antall sider er ikke lastet enda."}
                            </BodyShort>
                            <BodyShort spacing>Fjernede sider: {removedPages.length}</BodyShort>
                            <BodyShort spacing>Maskerte sider: {maskedPagesCount}</BodyShort>
                            <BodyShort spacing>Roterte sider: {rotatedPagesCount}</BodyShort>
                            <div className="mt-3 grid gap-1">
                                <BodyShort spacing>Følgende sider har blitt endret eller fjernet:</BodyShort>
                                <BodyShort size="small">
                                    <span className="font-semibold">Fjernede sider:</span>{" "}
                                    {formatPageNumbers(sortedRemovedPages)}
                                </BodyShort>
                                <BodyShort size="small">
                                    <span className="font-semibold">Maskerte sider:</span>{" "}
                                    {formatMaskedPages(sortedMaskedPages)}
                                </BodyShort>
                                <BodyShort size="small">
                                    <span className="font-semibold">Roterte sider:</span>{" "}
                                    {formatRotatedPages(sortedRotatedPages)}
                                </BodyShort>
                            </div>
                            <div className="flex flex-row flex-wrap gap-2 mt-2">
                                <Button size="xsmall" variant="tertiary" onClick={openOriginalPreview}>
                                    Vis original
                                </Button>
                                <Button size="xsmall" variant="tertiary" onClick={openEditedPreview}>
                                    Vis redigert utkast
                                </Button>
                            </div>
                            <BodyShort size="small" className="mt-2">
                                Åpne gjerne både originalen og redigert utkast for visuell sammenligning før
                                ferdigstilling.
                            </BodyShort>
                        </div>

                        <ProduceDocumentStateIndicator />
                        {submitError && (
                            <Alert
                                variant="error"
                                size="small"
                                className="mt-3 mb-3"
                            >{`Kunne ikke ferdigstille dokument: ${submitError}`}</Alert>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button size="small" variant={"primary"} onClick={_producePdf} loading={producingDocument}>
                            Ferdigstill og lukk
                        </Button>
                        <Button size="small" variant={"tertiary"} onClick={closeModal}>
                            Avbryt
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
}
