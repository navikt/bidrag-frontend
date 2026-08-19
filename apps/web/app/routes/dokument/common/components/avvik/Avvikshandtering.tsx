import { Button } from "@navikt/ds-react";
import React, { useState } from "react";

import { useGetAvvik, useHentJournalpost } from "../../../servicesV2/useDokumentApi";
import { useAppContext } from "../../../store/AppContext";
import AvvikshandteringModal from "./components/AvvikshandteringModal";

function Avvikshandtering() {
    const { påloggetEnhet, saksnummer } = useAppContext().appState;
    const avvikStateList = useGetAvvik();
    const journalpost = useHentJournalpost();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (avvikStateList.length === 0 || (!journalpost.isStatusMottatt && !journalpost.isTemaBidrag)) {
        return null;
    }

    return (
        <>
            <Button size="small" variant="secondary" type={"button"} onClick={openModal} id={"openAvvikButton"}>
                Avvikshåndtering
            </Button>
            {isModalOpen && (
                <React.Suspense fallback={<></>}>
                    <AvvikshandteringModal
                        closeModal={closeModal}
                        paloggetEnhet={påloggetEnhet}
                        saksnummer={saksnummer}
                    />
                </React.Suspense>
            )}
        </>
    );
}

export default Avvikshandtering;
