import type { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, Button, Modal } from "@navikt/ds-react";
import { useState } from "react";

export interface IOpprettSakModalProps {
    ident: string;
    bpIdent: string;
    navn: string;
    rolle: Rolletype;
    eierfogd: string;
    onSubmit: (saksnummer: string) => void;
}

/**
 * Opprett sak ble tidligere lastet inn som en Module Federation-remote fra bidrag-sak-ui.
 * Den remoten finnes ikke i bidrag-frontend, så inntil funksjonaliteten er migrert
 * viser vi en melding om at saken må opprettes i Bisys.
 */
export default function OpprettSakModal({ ident }: IOpprettSakModalProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <Button variant="secondary" size="xsmall" onClick={() => setModalOpen(true)}>
                Opprett sak
            </Button>
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                header={{ heading: "Opprett sak" }}
                id={`opprett${ident}`}
            >
                <Modal.Body>
                    <Alert variant="info" size="small">
                        Opprett sak er ikke tilgjengelig her ennå. Opprett saken i Bisys og oppdater siden.
                    </Alert>
                </Modal.Body>
            </Modal>
        </>
    );
}
