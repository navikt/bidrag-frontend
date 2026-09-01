import type { PersonBroadcastMessage } from "@bidrag/common";
import { Button, Modal } from "@navikt/ds-react";
import React, { type ReactElement, useRef, useState } from "react";

import { useAppContext } from "../../../store/AppContext";

interface AvansertSokProps {
    onResult: (data: PersonBroadcastMessage) => void;
}
export default function AvansertSok({ onResult }: AvansertSokProps): ReactElement {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const { showErrorMessage } = useAppContext();
    const closeModal = () => {
        searchCanceled.current = true;
        setModalOpen(false);
    };
    const openModal = () => setModalOpen(true);
    const searchCanceled = useRef<boolean>(false);

    function updateShowErrorMessage() {
        if (searchCanceled.current) {
            return;
        }
        showErrorMessage(["Det skjedde en feil ved henting av personinfo"]);
    }

    function openAdvancedSearch() {
        openModal();
        searchCanceled.current = false;
        const openedWindow = (window as any).openPersonsok();
        (window as any)
            .waitForPersonSokResult()
            .then((data) => {
                if (searchCanceled.current) {
                    return;
                }
                if (!data.ok) {
                    console.error("Det skjedde en feil ved henting av personinfo", data.error?.stack);
                    updateShowErrorMessage();
                    return;
                }
                onResult(data.payload);
            })
            .catch(showErrorMessage)
            .finally(() => {
                closeModal();
                window.focus();
                openedWindow.close();
            });
    }
    return (
        <>
            {modalOpen && (
                <Modal aria-label="" id={"avansertsok_modal"} onClose={() => null}>
                    <Modal.Header>Venter på resultat fra avansert søk ...</Modal.Header>
                    <Modal.Body style={{ width: "100%", height: "max-content", padding: "1rem" }}>
                        <Button onClick={closeModal} style={{ marginTop: "1rem" }}>
                            Avbryt
                        </Button>
                    </Modal.Body>
                </Modal>
            )}

            <div
                className={"pdlSearchButton"}
                style={{ padding: "30px 10px 0px 10px", height: "min-content", alignSelf: "baseline" }}
            >
                <Button size="small" variant="secondary" type={"button"} onClick={openAdvancedSearch}>
                    Personsøk
                </Button>
            </div>
        </>
    );
}
