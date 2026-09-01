import { Alert, BodyShort, Button, Heading, Modal } from "@navikt/ds-react";
import React, { useState } from "react";

import DokumentView from "../../../../common/components/dokument/DokumentView";
import { RedirectTo } from "../../../../common/utils/RedirectUtils";
import { useDistribuerJournalpost } from "../../../../servicesV2/useDistribusjonApi";
import { useHentJournalpost } from "../../../../servicesV2/useDokumentApi";
import { useAppContext } from "../../../../store/AppContext";

interface ManuellUtsendingModalProps {
    onCancel: () => void;
}
export default function ManuellUtsendingModal({ onCancel }: ManuellUtsendingModalProps) {
    const {
        updateAppState,
        appState: { påloggetEnhet, saksnummer },
    } = useAppContext();
    const journalpost = useHentJournalpost();
    const [submitState, setSubmitState] = useState<"pending" | "idle" | "succesfull" | "error">("idle");
    const distribuerJpMutation = useDistribuerJournalpost();

    function onSubmit() {
        setSubmitState("pending");
        updateAppState({ disableJournalpostPoller: true });

        distribuerJpMutation
            .mutateAsync({
                journalpostId: journalpost.journalpostId,
                paloggetenhet: påloggetEnhet,
                lokalUtskrift: true,
            })
            .then(() => {
                setSubmitState("succesfull");
                RedirectTo.sakshistorikk(saksnummer);
            })
            .catch(() => setSubmitState("error"));
    }

    function renderErrorMessage() {
        return (
            <Alert variant="error">
                <BodyShort>Det skjedde en feil. Vennligst prøv på nytt.</BodyShort>
            </Alert>
        );
    }

    const hoveddokument = journalpost.dokumenter[0];
    return (
        <Modal open onClose={onCancel} closeOnBackdropClick={submitState !== "succesfull"} aria-label="">
            <Modal.Header closeButton>
                <Heading size={"medium"}>Har du sendt brevet lokalt?</Heading>
            </Modal.Header>
            <Modal.Body>
                {submitState === "error" && renderErrorMessage()}
                <div className={"min-w-[35rem] relative  w-full max-w-2xl h-full md:h-auto"}>
                    <div className={"py-4"}>
                        <BodyShort>Jeg bekrefter at jeg har printet og sendt ut følgende brev:</BodyShort>
                        <div className={"pt-4"}>
                            {hoveddokument && (
                                <DokumentView journalpostId={journalpost.journalpostId} dokument={hoveddokument} />
                            )}
                        </div>
                        {journalpost.isForsendelse && journalpost.fagomrade != "FAR" && (
                            <BodyShort className="pt-4">
                                Etter bekreftelse vil dokumentet bli tilgjengelig på mottakerens "Min side", og tittelen
                                bli markert med <i>dokumentet er sendt per post med vedlegg</i>.
                            </BodyShort>
                        )}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button size="small" variant={"primary"} onClick={onSubmit} loading={submitState === "pending"}>
                    Bekreft og gå tilbake til sakshistorikk
                </Button>
                <Button size="small" variant={"tertiary"} disabled={submitState === "pending"} onClick={onCancel}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
