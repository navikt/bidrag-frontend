import { Link } from "@navikt/ds-react";
import type { ReactElement } from "react";

import environment from "../../../environment";
import { PageType, useAppContext } from "../../../store/AppContext";

export default function BisysLink(): ReactElement {
    const {
        appState: { sessionState, currentPage },
    } = useAppContext();
    function getBisysLink() {
        switch (currentPage) {
            case PageType.REGISTRER_JOURNALPOST:
                return environment.url.bisys("oppgaveliste", { sessionState });
            case PageType.VIS_JOURNALPOST:
                return environment.url.bisys("sakshistorikk", { sessionState });
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
