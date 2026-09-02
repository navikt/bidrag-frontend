import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";

import RegistrerJournalpost from "../pages/registrereJournalpost/index";

export const handle = { rendersOwnHeader: true };

/**
 * Registrerer (journalfører) en mottatt journalpost. Brukes både som toppnivårute
 * (`/registrer/:journalpostId`) og i sakskontekst (`/sak/:saksnummer/registrer/:journalpostId`).
 */
export default function RegistrerJournalpostRoute() {
    const { journalpostId, saksnummer } = useParams<{ journalpostId: string; saksnummer?: string }>();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = `Journalfør - ${journalpostId}`;
    }, [journalpostId]);

    return (
        <RegistrerJournalpost
            journalpostId={journalpostId}
            saksnummer={saksnummer}
            sessionState={searchParams.get("sessionState")}
            paloggetEnhet={searchParams.get("enhet")}
        />
    );
}
