import { Alert, Box, Loader } from "@navikt/ds-react";
import type { PdfState, SaksDokument } from "../types";

export interface PdfVisningProps {
    selectedDocument?: SaksDokument;
    viewerState: PdfState;
    isMetadataLoading: boolean;
}

export function PdfVisning({ selectedDocument, viewerState, isMetadataLoading }: PdfVisningProps) {
    const isLoading = isMetadataLoading || viewerState.loading;
    const hasError = Boolean(viewerState.error);
    const hasSource = Boolean(viewerState.src);

    return (
        <section className="flex-1 min-w-0 sticky top-4 h-[calc(100vh-4em)] flex flex-col">
            <Box className="flex-1 overflow-hidden flex items-center justify-center">
                {isLoading ? (
                    <Loader size="xlarge" title="Laster dokument" />
                ) : hasError ? (
                    <Box padding="space-16">
                        <Alert variant="error">{viewerState.error}</Alert>
                    </Box>
                ) : hasSource ? (
                    <iframe
                        title={selectedDocument?.tittel ?? "Dokument"}
                        src={`${viewerState.src}#view=FitH`}
                        className="w-full h-full border-0 block"
                    />
                ) : (
                    <Box padding="space-16">
                        <Alert variant="info">Velg et dokument som kan åpnes for å se innholdet</Alert>
                    </Box>
                )}
            </Box>
        </section>
    );
}
