import { useEffect } from "react";
import { useParams } from "react-router";

import SkjemaUtfyllingPage from "../pages/skjemutfylling/SkjemaUtfyllingPage";

export const handle = { rendersOwnHeader: true };

/**
 * Skjemautfylling for et dokument i en forsendelse
 * (`/rediger/skjemautfylling/:forsendelseId/:dokumentreferanse`).
 */
export default function SkjemaUtfyllingRoute() {
    const { forsendelseId, dokumentreferanse } = useParams<{ forsendelseId: string; dokumentreferanse: string }>();

    useEffect(() => {
        document.title = `Skjemautfylling - ${forsendelseId}`;
    }, [forsendelseId]);

    return <SkjemaUtfyllingPage forsendelseId={forsendelseId!} dokumentreferanse={dokumentreferanse!} />;
}
