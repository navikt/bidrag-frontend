import { PaperplaneIcon as Send } from "@navikt/aksel-icons";
import React, { useEffect, useState } from "react";

import AvvikshandteringModal from "../../../../common/components/avvik/components/AvvikshandteringModal";
import IkonKnapp from "../../../../common/components/icons/IkonKnapp";
import { useAppContext } from "../../../../store/AppContext";
import { AvvikType } from "../../../../types/api/AvvikTypes";
import type { Sak } from "../../../../types/sak";

interface OverforSakButtonProps {
    sak: Sak;
    onModalStateChange?: (isOpen: boolean) => void;
}

export default function OverforSakButton({ sak, onModalStateChange }: OverforSakButtonProps) {
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const [isAvvikModalOpen, setIsAvvikModalOpen] = useState<boolean>(false);
    const openAvvikModal = () => setIsAvvikModalOpen(true);
    const closeAvvikModal = () => setIsAvvikModalOpen(false);

    useEffect(() => {
        onModalStateChange?.(isAvvikModalOpen);
    }, [isAvvikModalOpen]);

    return (
        <>
            <IkonKnapp
                ikonPlacement={"right"}
                tekst={"Overfør"}
                ikonElement={<Send />}
                className={"overfor-button"}
                onClick={openAvvikModal}
            />
            <React.Suspense fallback={<></>}>
                {isAvvikModalOpen && (
                    <AvvikshandteringModal
                        closeModal={closeAvvikModal}
                        paloggetEnhet={påloggetEnhet}
                        initialAvvik={{
                            type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
                            nyttEnhetsnummer: sak.eierfogd,
                            gammeltEnhetsnummer: "",
                        }}
                    />
                )}
            </React.Suspense>
        </>
    );
}
