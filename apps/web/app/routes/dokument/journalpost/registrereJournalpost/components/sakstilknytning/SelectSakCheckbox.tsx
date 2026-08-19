import { Checkbox } from "@navikt/ds-react";
import React, { ReactElement, useState } from "react";

import { Sak } from "../../../../types/sak";
import PersonSakNoAccessWarning from "../modal/PersonSakNoAccessWarning";

interface SelectSakCheckboxProps {
    isSelected: boolean;
    sak: Sak;
    onChecked: () => void;
}
export default function SelectSakCheckbox({ sak, isSelected, onChecked }: SelectSakCheckboxProps): ReactElement {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const openSakNoAccessModal = () => setIsModalOpen(true);
    const closeSakNoAccessModal = () => setIsModalOpen(false);
    return (
        <>
            <Checkbox
                className={"sakstilknyttningCheckbox"}
                checked={isSelected}
                value={sak.saksnummer}
                onChange={() => {
                    if (sak.begrensetTilgang) {
                        openSakNoAccessModal();
                    } else {
                        onChecked();
                    }
                }}
            >
                {" "}
            </Checkbox>
            {isModalOpen && <PersonSakNoAccessWarning sak={sak} onCancel={closeSakNoAccessModal} />}
        </>
    );
}
