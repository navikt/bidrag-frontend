import React from "react";

import VisJournalpostProvider from "./context/VisJournalpostProvider";
import VisJournalpostContainer from "./VisJournalpostContainer";

export default function VisJournalpostPage() {
    return (
        <VisJournalpostProvider>
            <VisJournalpostContainer />
        </VisJournalpostProvider>
    );
}
