import { Heading, Modal } from "@navikt/ds-react";

import type { DistribuerTilAdresse } from "../../../types/api/JournalpostTypes";
import AdresseInfo from "./AdresseInfo";

interface AdresseViewModalProps {
    onCancel: () => void;
    adresse: DistribuerTilAdresse;
}
export default function AdresseViewModal({ adresse, onCancel }: AdresseViewModalProps) {
    return (
        <Modal open aria-label="" onClose={onCancel} closeOnBackdropClick={true} className="max-w-full w-[400px]">
            <Modal.Header closeButton>
                <Heading size="small">Dokument ble sendt til adresse:</Heading>
            </Modal.Header>
            <Modal.Body>
                <AdresseInfo adresse={adresse} />
            </Modal.Body>
        </Modal>
    );
}
