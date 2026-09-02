import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";

import VisJournalpost from "../pages/visjournalpost/index";

export const handle = { rendersOwnHeader: true };

/**
 * Viser en journalpost. Brukes både som toppnivårute (`/journal/:journalpostId`) og i
 * sakskontekst (`/sak/:saksnummer/journal/:journalpostId`).
 */
export default function VisJournalpostRoute() {
    const { journalpostId, saksnummer } = useParams<{ journalpostId: string; saksnummer?: string }>();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = `Journalpost - ${journalpostId}`;
    }, [journalpostId]);

    return (
        <VisJournalpost
            journalpostId={journalpostId}
            saksnummer={saksnummer}
            sessionState={searchParams.get("sessionState")}
            paloggetEnhet={searchParams.get("enhet")}
        />
    );
}
