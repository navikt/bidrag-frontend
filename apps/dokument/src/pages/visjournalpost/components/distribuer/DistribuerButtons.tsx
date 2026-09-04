import { Button } from "@navikt/ds-react";
import React, { useState } from "react";

import { useKanDistribuereJournalpost } from "../../../../hooks/useDistribusjonApi";
import { useHentJournalpost } from "../../../../hooks/useDokumentApi";
import BestillDistribusjonModal from "./BestillDistribusjonModal";
import ManuellUtsendingModal from "./ManuellUtsendingModal";

export default function DistribuerButtons() {
    const journalpost = useHentJournalpost();

    if (!journalpost.isKlarTilPrint) {
        return null;
    }

    return (
        <React.Suspense fallback={null}>
            <div id={"distribuer_buttons"} className={"flex flex-row gap-5"}>
                {!journalpost.isJoarkJournalpost && <SendManueltButton />}
                <BestillDistribusjonButton />
            </div>
        </React.Suspense>
    );
}

function SendManueltButton() {
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    return (
        <>
            {modalOpen && <ManuellUtsendingModal onCancel={() => setModalOpen(false)} />}
            <Button size="small" id={"send_manuelt_knapp"} variant={"secondary"} onClick={() => setModalOpen(true)}>
                Send lokalt
            </Button>
        </>
    );
}
function BestillDistribusjonButton() {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const enabled = useKanDistribuereJournalpost();

    if (!enabled) {
        return null;
    }

    return (
        <>
            {modalOpen && (
                <React.Suspense fallback={null}>
                    <BestillDistribusjonModal onCancel={() => setModalOpen(false)} />
                </React.Suspense>
            )}
            <Button
                size="small"
                id={"start_distribusjon_knapp"}
                variant={"secondary"}
                onClick={() => setModalOpen(true)}
            >
                Send sentralt/digitalt
            </Button>
        </>
    );
}
