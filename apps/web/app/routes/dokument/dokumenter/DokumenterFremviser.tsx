import { Alert, VStack } from "@navikt/ds-react";
import { useHentDokumenterPdf } from "~/api/useApi.ts";
import { PdfVisning } from "~/common/dokument/PdfVisning";

interface DokumenterFremviserProps {
    dokumenter: string[];
}

/**
 * Viser én sammenslått PDF for dokumentene angitt i URL-en (`?dokument=<Kilde>-<journalpostId>:<dokumentReferanse>`).
 * Henter dokumentene med `hentDokumenter`-endepunktet og gjenbruker `PdfVisning` for selve visningen.
 */
export function DokumenterFremviser({ dokumenter }: DokumenterFremviserProps) {
    const { data, isFetching, error } = useHentDokumenterPdf(dokumenter, dokumenter.length > 0);

    if (dokumenter.length === 0) {
        return (
            <VStack align="center" justify="center" style={{ height: "100vh", padding: "var(--a-spacing-16)" }}>
                <Alert variant="warning">
                    Ingen dokumenter er angitt. Legg til minst én <code>dokument</code>-parameter i URL-en, f.eks.{" "}
                    <code>?dokument=JOARK-123:456</code>.
                </Alert>
            </VStack>
        );
    }

    const tittel =
        dokumenter.length > 1 ? `Sammenslått dokument (${dokumenter.length} dokumenter)` : (dokumenter[0] ?? "");

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <PdfVisning
                dokument={{ tittel, kanÅpnes: true }}
                kilde={{ data, isFetching, error: (error as Error) ?? null }}
            />
        </div>
    );
}
