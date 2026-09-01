import React from "react";

import { PageType } from "../../store/AppContext";
import PageWrapper from "../PageWrapper";
import VisJournalpostPage from "./VisJournalpostPage";

interface VisJournalpostProps {
    journalpostId: string;
    sessionState: string;
    paloggetEnhet: string;
    saksnummer: string;
}

export default function VisJournalpost(props: VisJournalpostProps) {
    return (
        <PageWrapper {...props} page={PageType.VIS_JOURNALPOST}>
            <VisJournalpostPage />
        </PageWrapper>
    );
}
