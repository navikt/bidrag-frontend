import { useEffect } from "react";
import { useParams } from "react-router";

import DokumentMaskeringPage from "../pages/dokumentmaskering/DokumentMaskeringPage";

export const handle = { rendersOwnHeader: true };

/**
 * Maskering av dokument for en forsendelse (`/rediger/masker/:forsendelseId/:dokumentreferanse`).
 */
export default function DokumentMaskeringRoute() {
    const { forsendelseId, dokumentreferanse } = useParams<{ forsendelseId: string; dokumentreferanse: string }>();

    useEffect(() => {
        document.title = `Dokumentmaskering - ${forsendelseId}`;
    }, [forsendelseId]);

    return <DokumentMaskeringPage forsendelseId={forsendelseId!} dokumentreferanse={dokumentreferanse!} />;
}
