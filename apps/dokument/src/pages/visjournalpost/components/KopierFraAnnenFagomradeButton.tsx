import { Button } from "@navikt/ds-react";
import { useState } from "react";

import AvvikshandteringModal from "../../../common/components/avvik/components/AvvikshandteringModal";
import { useHentJournalpost } from "../../../hooks/useDokumentApi";
import { useAppContext } from "../../../store/AppContext";
import { AvvikType } from "../../../types/api/AvvikTypes";

export default function KopierFraAnnenFagomradeButton() {
    const [modalOpen, setModalOpen] = useState(false);
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const journalpost = useHentJournalpost();
    if (journalpost.isTemaBidrag || journalpost.isStatusMottatt) {
        return null;
    }
    return (
        <>
            <Button size="small" onClick={() => setModalOpen(true)} variant={"primary"}>
                Kopier til Bidrag
            </Button>
            {modalOpen && (
                <AvvikshandteringModal
                    closeModal={() => setModalOpen(false)}
                    paloggetEnhet={påloggetEnhet}
                    initialAvvikType={AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE}
                />
            )}
        </>
    );
}
