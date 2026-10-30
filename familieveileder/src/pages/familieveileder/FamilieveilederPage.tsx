import { Caseworker } from "@navikt/ds-icons";
import { Button, Modal } from "@navikt/ds-react";
import React, { useState } from "react";

import RolleveilederModalContent from "../../components/modal-content/rolleveileder-modal-content/RolleveilederModalContent";
import { RolleType } from "../../types/rolleveileder";
import { Rolleveileder } from "../../types/rolleveileder";
import PageWrapper from "../PageWrapper";

export interface IFamilieveilederProps {
    fodselsnummer: string;
    rolle: RolleType;
    valgteRoller: Rolleveileder;
    onSubmit: (rolleveileder: Rolleveileder) => void;
}

export default function FamilieveilederPage(props: IFamilieveilederProps) {
    const [open, setOpen] = useState<boolean>(false);

    function openModal() {
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
    }

    return (
        <PageWrapper name={"familieveileder"}>
            <Button
                type="button"
                variant="tertiary"
                size="small"
                title="Åpne rolleveileder"
                aria-label="Åpne rolleveileder"
                icon={<Caseworker aria-hidden />}
                onClick={openModal}
            />
            <Modal width="medium" open={open} onClose={closeModal} header={{ heading: "Rolleveileder", size: "small" }}>
                <RolleveilederModalContent onClose={closeModal} {...props} />
            </Modal>
        </PageWrapper>
    );
}
