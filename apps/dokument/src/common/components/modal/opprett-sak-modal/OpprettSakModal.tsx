import { OpprettSakFlytModal, OpprettSakProvider, OpprettSakSkjema } from "@bidrag/saksroller";
import { Loader, Modal } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import { Suspense } from "react";

export interface IOpprettSakModalProps {
    isOpen: boolean;
    ident: string;
    navn: string;
    eierfogd: string;
    onSubmit: (saksnummer: string) => void;
    onClose: () => void;
}

/**
 * "Opprett sak" ble tidligere lastet inn som en Module Federation-remote fra
 * bidrag-sak-ui. Den funksjonaliteten er nå migrert til `@bidrag/saksroller`, og gjenbrukes
 * her som en innebygd modal, styrt utenfra via `isOpen`/`onClose` slik den
 * gamle modalen ble brukt.
 */
export default function OpprettSakModal({ isOpen, ident, navn, eierfogd, onSubmit, onClose }: IOpprettSakModalProps) {
    const harNyFlyt = useFlag("bisys.ny_rollebilde");

    if (harNyFlyt) {
        return (
            <OpprettSakFlytModal
                open={isOpen}
                onClose={onClose}
                ident={ident}
                eierfogd={eierfogd}
                onOpprettet={(saksnummer) => {
                    onSubmit(saksnummer);
                    onClose();
                }}
            />
        );
    }

    if (!isOpen) {
        return null;
    }

    return (
        <OpprettSakProvider ident={ident} navn={navn} eierfogd={eierfogd} onSubmit={onSubmit} onClose={onClose}>
            <Modal open onClose={onClose} header={{ heading: "Opprett sak" }} id={`opprett${ident}`}>
                <Modal.Body>
                    <Suspense
                        fallback={
                            <div className="flex justify-center">
                                <Loader size="3xlarge" title="Laster..." variant="interaction" />
                            </div>
                        }
                    >
                        <OpprettSakSkjema />
                    </Suspense>
                </Modal.Body>
            </Modal>
        </OpprettSakProvider>
    );
}
