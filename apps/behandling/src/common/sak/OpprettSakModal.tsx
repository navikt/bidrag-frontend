import type { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { OpprettSakProvider, type OpprettSakRolleType, OpprettSakSkjema } from "@bidrag/common";
import { Button, Loader, Modal } from "@navikt/ds-react";
import { Suspense, useState } from "react";

export interface IOpprettSakModalProps {
    ident: string;
    bpIdent: string;
    navn: string;
    rolle: Rolletype;
    eierfogd: string;
    onSubmit: (saksnummer: string) => void;
}

/**
 * "Opprett sak" ble tidligere lastet inn som en Module Federation-remote fra
 * bidrag-sak-ui. Den funksjonaliteten er nå migrert til `@bidrag/common`
 * (se packages/common/src/react_components/sak/opprett-sak/), og gjenbrukes
 * her som en innebygd modal i stedet for at saksbehandler må opprette saken
 * i Bisys.
 *
 * `bpIdent` (bidragspliktig-identen som utløste "opprett sak") sendes videre
 * som forhåndsvalgt forelder når barnet opprettes med rolle BA, slik at
 * saksbehandler slipper å velge den på nytt i familieenheter-steget.
 */
export default function OpprettSakModal({ ident, bpIdent, navn, rolle, eierfogd, onSubmit }: IOpprettSakModalProps) {
    const [modalOpen, setModalOpen] = useState(false);

    function onClose() {
        setModalOpen(false);
    }

    function håndterSubmit(saksnummer: string) {
        onSubmit(saksnummer);
        setModalOpen(false);
    }

    return (
        <>
            <Button variant="secondary" size="xsmall" onClick={() => setModalOpen(true)}>
                Opprett sak
            </Button>
            {modalOpen && (
                <OpprettSakProvider
                    ident={ident}
                    navn={navn}
                    eierfogd={eierfogd}
                    rolle={rolle as unknown as OpprettSakRolleType}
                    initialSelectedForeldre={
                        bpIdent ? { ident: bpIdent, rolle: "BP" as OpprettSakRolleType } : undefined
                    }
                    onSubmit={håndterSubmit}
                    onClose={onClose}
                >
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
            )}
        </>
    );
}
