import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";

import ForsendelsePage from "../pages/forsendelse/ForsendelsePage";

export const handle = { rendersOwnHeader: true };

/**
 * Viser en eksisterende forsendelse. Brukes både som toppnivårute
 * (`/forsendelse/:forsendelseId`) og i sakskontekst
 * (`/sak/:saksnummer/forsendelse/:forsendelseId`).
 */
export default function ForsendelseRoute() {
    const { forsendelseId, saksnummer } = useParams<{ forsendelseId?: string; saksnummer?: string }>();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = `Forsendelse - ${saksnummer ?? forsendelseId}`;
    }, [saksnummer, forsendelseId]);

    return (
        <ForsendelsePage
            forsendelseId={forsendelseId}
            saksnummer={saksnummer}
            sessionId={searchParams.get("sessionState")}
            enhet={searchParams.get("enhet")}
        />
    );
}
