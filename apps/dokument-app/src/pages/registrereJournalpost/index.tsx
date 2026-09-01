import React from "react";

import { PageType } from "../../store/AppContext";
import PageWrapper from "../PageWrapper";
import RegistrereJournalpostContainer from "./RegistrereJournalpostContainer";

interface RegistrerJournalpostProps {
    journalpostId: string;
    sessionState: string;
    paloggetEnhet: string;
    saksnummer: string;
}

export default function RegistrerJournalpost(props: RegistrerJournalpostProps) {
    return (
        <PageWrapper {...props} page={PageType.REGISTRER_JOURNALPOST}>
            <RegistrereJournalpostContainer />
        </PageWrapper>
    );
}
