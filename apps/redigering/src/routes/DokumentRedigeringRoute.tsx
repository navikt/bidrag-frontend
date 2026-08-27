import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";

const DokumentRedigeringPage = lazy(() => import("../pages/dokumentredigering/DokumentRedigeringPage"));

export const handle = { rendersOwnHeader: true };

/**
 * Viser og redigerer et dokument. Brukes både uten dokumentreferanse
 * (`/rediger/:journalpostId`) og med (`/rediger/:journalpostId/:dokumentreferanse`).
 *
 * Siden bruker `pdfjs-dist/web/pdf_viewer`, som ikke kan lastes/evalueres på
 * serveren (leser `window`/`document` ved import). Siden lastes derfor kun
 * på klienten, med lazy import for å unngå at SSR-bunten prøver å laste modulen.
 */
export default function DokumentRedigeringRoute() {
    const { journalpostId, dokumentreferanse } = useParams<{ journalpostId?: string; dokumentreferanse?: string }>();
    const [searchParams] = useSearchParams();
    const [erMontert, setErMontert] = useState(false);

    useEffect(() => {
        document.title = `Dokumentredigering - ${journalpostId ?? ""}`;
    }, [journalpostId]);

    useEffect(() => {
        setErMontert(true);
    }, []);

    if (!erMontert) return null;

    return (
        <Suspense fallback={null}>
            <DokumentRedigeringPage
                journalpostId={journalpostId!}
                dokumentreferanse={dokumentreferanse}
                dokumenter={searchParams.getAll("dokument")}
            />
        </Suspense>
    );
}
