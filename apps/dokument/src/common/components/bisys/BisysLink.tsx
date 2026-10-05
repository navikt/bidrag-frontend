import { Link } from "@navikt/ds-react";
import type { ReactElement } from "react";
import { useSearchParams } from "react-router";

import environment from "../../../environment";
import { PageType, useAppContext } from "../../../store/AppContext";

/** Query-verdien som forteller at brukeren kom fra Bisys og derfor skal tilbake dit. */
const BISYS_RETUR_VERDI = "bisys";

export default function BisysLink(): ReactElement {
    const {
        appState: { sessionState, currentPage, saksnummer },
    } = useAppContext();
    const [searchParams] = useSearchParams();
    const kommerFraBisys = searchParams.get("from") === BISYS_RETUR_VERDI;

    function getSakshistorikkLink() {
        // Uten `?from=bisys` hører brukeren hjemme i sakshistorikken i denne appen.
        if (!kommerFraBisys && saksnummer) {
            const params = new URLSearchParams();
            if (sessionState) params.set("sessionState", sessionState);
            const query = params.toString();
            return `/sak/${saksnummer}/sakshistorikk${query ? `?${query}` : ""}`;
        }
        return environment.url.bisys("sakshistorikk", { sessionState });
    }

    function getBisysLink() {
        switch (currentPage) {
            case PageType.REGISTRER_JOURNALPOST:
                return environment.url.bisys("oppgaveliste", { sessionState });
            case PageType.VIS_JOURNALPOST:
                return getSakshistorikkLink();
        }
    }

    function getLinkLabel() {
        switch (currentPage) {
            case PageType.REGISTRER_JOURNALPOST:
                return "Tilbake til Oppgavelisten";
            case PageType.VIS_JOURNALPOST:
                return "Tilbake til Sakshistorikk";
        }
    }

    return <Link href={getBisysLink()}>{getLinkLabel()}</Link>;
}
