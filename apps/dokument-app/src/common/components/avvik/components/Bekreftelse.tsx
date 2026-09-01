import { Alert, Loader } from "@navikt/ds-react";
import React, { type ReactNode } from "react";

import { useJournalpost } from "../../../../store/JournalpostContext";

interface BekreftelseProps {
    children: ReactNode;
}

function Bekreftelse(props: BekreftelseProps) {
    const { avvikState } = useJournalpost();

    if (avvikState == "pending") {
        return (
            <div className="AvvikshandteringModal__spinner-wrapper">
                <Loader transparent={true} type="XL" aria-label="Sender avvik" />
            </div>
        );
    } else if (avvikState === "failure") {
        return <Alert variant="error">En feil har oppstått ved sending av avvik. Avviket har ikke blir lagret.</Alert>;
    } else {
        return (
            <Alert variant="success">
                <div>{props.children}</div>
            </Alert>
        );
    }
}

export default Bekreftelse;
