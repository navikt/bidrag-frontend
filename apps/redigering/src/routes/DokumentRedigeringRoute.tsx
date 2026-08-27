import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";

import DokumentRedigeringPage from "../pages/dokumentredigering/DokumentRedigeringPage";

export const handle = { rendersOwnHeader: true };

/**
 * Viser og redigerer et dokument. Brukes både uten dokumentreferanse
 * (`/rediger/:journalpostId`) og med (`/rediger/:journalpostId/:dokumentreferanse`).
 */
export default function DokumentRedigeringRoute() {
    const { journalpostId, dokumentreferanse } = useParams<{ journalpostId?: string; dokumentreferanse?: string }>();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = `Dokumentredigering - ${journalpostId ?? ""}`;
    }, [journalpostId]);

    return (
        <DokumentRedigeringPage
            journalpostId={journalpostId!}
            dokumentreferanse={dokumentreferanse}
            dokumenter={searchParams.getAll("dokument")}
        />
    );
}
