import { useEffect, useRef } from "react";

import { JournalpostDto } from "../../api/BidragDokumentApi";
import { BIDRAG_DOKUMENT_API } from "../../servicesV2/api";
import { useHentJournalpost, useResetJournalpost } from "../../servicesV2/useDokumentApi";
import { useAppContext } from "../../store/AppContext";
import { JournalStatus } from "../../types/journalpost";
import { isEmpty } from "../utils/ObjectUtils";
import { RedirectTo } from "../utils/RedirectUtils";

export default function useJournalpostChangePoller() {
    const {
        appState: { disableJournalpostPoller },
    } = useAppContext();
    const journalpost = useHentJournalpost();
    const resetJp = useResetJournalpost();
    const intervalRef = useRef<NodeJS.Timer>(null);

    useEffect(() => {
        if (!pollForChanges()) return;
        intervalRef.current = setInterval(refreshHvisJournalpostEndret, 4000);
        return () => clearInterval(intervalRef.current);
    }, [journalpost, disableJournalpostPoller]);

    function pollForChanges() {
        if (disableJournalpostPoller) return false;

        return (
            journalpost.isKlarTilPrint ||
            journalpost.journalstatus == JournalStatus.UNDER_PRODUKSJON ||
            journalpost.journalstatus == JournalStatus.OPPRETTET ||
            (journalpost.isForsendelse && journalpost.isNotat)
        );
    }
    async function refreshHvisJournalpostEndret() {
        const hentetJournalpostResponse = await BIDRAG_DOKUMENT_API.journal.hentJournalpost(journalpost.journalpostId);
        const hentetJournalpost = hentetJournalpostResponse.data.journalpost;
        if (journalpost.isForsendelse && !isEmpty(hentetJournalpost.joarkJournalpostId)) {
            clearInterval(intervalRef.current);
            RedirectTo.joarkJournalpostId(journalpost.journalpostId, `JOARK-${hentetJournalpost.joarkJournalpostId}`);
        } else if (erJournalpostEndret(hentetJournalpost)) {
            resetJp();
        }
    }

    function erJournalpostEndret(hentetJournalpost: JournalpostDto) {
        const statusEndret = journalpost.journalstatus != hentetJournalpost.journalstatus;
        return statusEndret;
    }
}
