import {Link} from "@navikt/ds-react";
import React, {ReactElement} from "react";

import {PageType, useAppContext} from "../../../store/AppContext";

export default function BisysLink(): ReactElement {
    const {
        appState: {sessionState, currentPage},
    } = useAppContext();

    function getBisysLink() {
        switch (currentPage) {
            case PageType.REGISTRER_JOURNALPOST:
                return `${'environment.url.bisys'}Oppgaveliste.do?sessionState=${sessionState}`;
            case PageType.VIS_JOURNALPOST:
                return `${'environment.url.bisys'}Sakshistorikk.do?sessionState=${sessionState}`;
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
