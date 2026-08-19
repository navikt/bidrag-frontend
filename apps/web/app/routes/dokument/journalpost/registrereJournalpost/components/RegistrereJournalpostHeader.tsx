import React from "react";

import Header from "../../../common/components/Header";
import { useAppContext } from "../../../store/AppContext";

export default function RegistrereJournalpostHeader() {
    const {
        appState: { journalpostId },
    } = useAppContext();
    return <Header journalpostId={journalpostId} title={"Registrer journalpost"} />;
}
