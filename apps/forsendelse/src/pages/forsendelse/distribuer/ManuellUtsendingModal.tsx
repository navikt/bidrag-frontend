import type { DistribuerJournalpostRequest, DistribuerJournalpostResponse } from "@bidrag/api/BidragForsendelseApi";
import { Alert, BodyShort, Button, ConfirmationPanel, Modal } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { useState } from "react";
import { useBidragForsendelseApi } from "../../../api/api";
import { useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
import { RedirectTo } from "../../../utils/RedirectUtils";

const CONFIRMATION_MISSING_ERROR = "CONFIRMATION_MISSING_ERROR";
interface ManuellUtsendingModalProps {
    onCancel: () => void;
}
export default function ManuellUtsendingModal({ onCancel }: ManuellUtsendingModalProps) {
    const forsendelse = useHentForsendelseQuery();
    const bidragForsendelseApi = useBidragForsendelseApi();
    const [confirmationState, setConfirmationState] = useState(false);
    const distribuerMutation = useMutation<AxiosResponse<DistribuerJournalpostResponse>, string>({
        mutationFn: () => {
            if (!confirmationState) {
                throw CONFIRMATION_MISSING_ERROR;
            }
            const request: DistribuerJournalpostRequest = {
                lokalUtskrift: true,
            };
            return bidragForsendelseApi.api.distribuerForsendelse(forsendelse.forsendelseId, request);
        },
        onSuccess: () => {
            RedirectTo.sakshistorikk(forsendelse.saksnummer);
        },
    });
    function onSubmit() {
        distribuerMutation.mutate();
    }

    function renderErrorMessage() {
        return (
            <Alert variant="error">
                <BodyShort>Det skjedde en feil. Vennligst prøv på nytt.</BodyShort>
            </Alert>
        );
    }

    return (
        <Modal
            onClose={onCancel}
            open
            header={{
                heading: "Sende lokalt",
                closeButton: !distribuerMutation.isSuccess,
            }}
            closeOnBackdropClick={!distribuerMutation.isSuccess}
        >
            <Modal.Body>
                <div>
                    {distribuerMutation.isError &&
                        distribuerMutation.error !== CONFIRMATION_MISSING_ERROR &&
                        renderErrorMessage()}
                    <div className={"min-w-[35rem] relative  w-full max-w-2xl h-full md:h-auto"}>
                        <div className={"py-4"}>
                            <BodyShort>
                                Det vil bli automatisk lagt til <i>(dokumentet er sendt per post med vedlegg)</i> bak
                                tittel
                            </BodyShort>
                        </div>
                        <ConfirmationPanel
                            size="small"
                            checked={confirmationState}
                            label="Jeg har printet og sendt ut alle dokumentene i forsendelsen"
                            error={
                                distribuerMutation.error === CONFIRMATION_MISSING_ERROR
                                    ? "Du må bekrefte før du går videre"
                                    : null
                            }
                            onChange={() => setConfirmationState((x) => !x)}
                        ></ConfirmationPanel>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="flex items-center pt-2 space-x-2 ">
                <Button
                    size="small"
                    variant={"primary"}
                    onClick={onSubmit}
                    loading={distribuerMutation.isPending || distribuerMutation.isSuccess}
                >
                    Bekreft og gå tilbake til sakshistorikk
                </Button>
                <Button size="small" variant={"tertiary"} disabled={distribuerMutation.isPending} onClick={onCancel}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
