import { Button } from "@navikt/ds-react";
import { createContext, Suspense, useContext, useState } from "react";

import { useHentAvvikListe } from "../../../hooks/useDokumentApi";
import { useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
import type { AvvikType } from "../../../types/AvvikTypes";
import type { IForsendelse } from "../../../types/Forsendelse";
import { useSession } from "../context/SessionContext";
import AvvikshandteringModal from "./components/AvvikshandteringModal";

interface AvvikProviderProps {
    onCancel: () => void;
    saksnummer: string;
    paloggetEnhet: string;
    forsendelseId: string;
    avvikListe: AvvikType[];
    forsendelse: IForsendelse;
}
export const useAvvikModalContext = () => useContext(AvvikModalContext);
const AvvikModalContext = createContext<AvvikProviderProps>({} as AvvikProviderProps);

function AvvikshandteringButton() {
    const { forsendelseId, saksnummer, enhet } = useSession();
    const { data: avvikListe } = useHentAvvikListe(forsendelseId, saksnummer, enhet);
    const forsendelse = useHentForsendelseQuery();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (avvikListe.length === 0) {
        return null;
    }

    return (
        <>
            <Button size="small" variant="secondary" type={"button"} onClick={openModal} id={"openAvvikButton"}>
                Avvikshåndtering
            </Button>
            {isModalOpen && (
                <Suspense fallback={<div></div>}>
                    <AvvikModalContext.Provider
                        value={{
                            onCancel: closeModal,
                            forsendelseId,
                            saksnummer,
                            paloggetEnhet: enhet,
                            forsendelse,
                            avvikListe,
                        }}
                    >
                        <AvvikshandteringModal />
                    </AvvikModalContext.Provider>
                </Suspense>
            )}
        </>
    );
}

export default AvvikshandteringButton;
