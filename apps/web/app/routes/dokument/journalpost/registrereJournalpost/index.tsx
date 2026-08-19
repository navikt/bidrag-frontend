import React from "react";
import { useBisysLink } from "~/common/bisys/useBisysLink.ts";
import PageWrapper from "../../PageWrapper";
import { PageType } from "../../store/AppContext";
import RegistrereJournalpostContainer from "./RegistrereJournalpostContainer";

interface RegistrerJournalpostProps {
    journalpostId: string;
    sessionState: string;
    paloggetEnhet: string;
    saksnummer: string;
}

export default function RegistrerJournalpost(props: RegistrerJournalpostProps) {
    const { bisysUrl, setBisysLinkTarget } = useBisysLink();
    setBisysLinkTarget("sak", { saksnr: "ljglhjg" }); //TODO NGHI

    console.log(bisysUrl);
    return (
        <PageWrapper {...props} page={PageType.REGISTRER_JOURNALPOST}>
            <RegistrereJournalpostContainer />
        </PageWrapper>
    );
}
