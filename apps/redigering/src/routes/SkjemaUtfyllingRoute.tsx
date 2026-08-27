import { Suspense, lazy, useEffect, useState } from "react";
import { useParams } from "react-router";

const SkjemaUtfyllingPage = lazy(() => import("../pages/skjemutfylling/SkjemaUtfyllingPage"));

export const handle = { rendersOwnHeader: true };

/**
 * Skjemautfylling for et dokument i en forsendelse
 * (`/rediger/skjemautfylling/:forsendelseId/:dokumentreferanse`).
 *
 * Siden bruker `pdfjs-dist/web/pdf_viewer`, som ikke kan lastes/evalueres på
 * serveren (leser `window`/`document` ved import). Siden lastes derfor kun
 * på klienten, med lazy import for å unngå at SSR-bunten prøver å laste modulen.
 */
export default function SkjemaUtfyllingRoute() {
    const { forsendelseId, dokumentreferanse } = useParams<{ forsendelseId: string; dokumentreferanse: string }>();
    const [erMontert, setErMontert] = useState(false);

    useEffect(() => {
        document.title = `Skjemautfylling - ${forsendelseId}`;
    }, [forsendelseId]);

    useEffect(() => {
        setErMontert(true);
    }, []);

    if (!erMontert) return null;

    return (
        <Suspense fallback={null}>
            <SkjemaUtfyllingPage forsendelseId={forsendelseId!} dokumentreferanse={dokumentreferanse!} />
        </Suspense>
    );
}
