import { useEffect } from "react";
import { useParams } from "react-router";
import environment from "../environment";
import DebugPage from "../pages/debug/DebugPage";

export const handle = { rendersOwnHeader: true };

/**
 * Debug-verktøy for dokumentredigering (`/rediger/debug/:forsendelseId/:dokumentreferanse`).
 * Skjules bak `environment.feature.debugPage` (samme mekanisme som i den
 * frittstående appen), men ruten registreres alltid slik at rutetreet er statisk.
 */
export default function DebugRoute() {
    const { forsendelseId, dokumentreferanse } = useParams<{ forsendelseId: string; dokumentreferanse: string }>();

    useEffect(() => {
        document.title = `Debug - ${forsendelseId}`;
    }, [forsendelseId]);

    if (!environment.feature.debugPage) {
        return null;
    }

    return <DebugPage forsendelseId={forsendelseId!} dokumentreferanse={dokumentreferanse!} />;
}
