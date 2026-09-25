import { Loader, Modal } from "@navikt/ds-react";
import { type ComponentType, createContext, Suspense, useContext } from "react";

export type NyOpprettSakFlytProps = {
    ident: string;
    rolle?: "BP" | "BM" | "BA";
    initialForelder?: { ident: string; rolle: "BP" | "BM" };
    eierfogd?: string;
    onOpprettet: (saksnummer: string) => void;
    onAvbryt: () => void;
};

/**
 * Den nye opprett-sak-flyten bor i apps/web. Appen legger den inn her, slik at
 * behandling og dokument kan vise den uten å importere apps/web.
 * `null` betyr at den gamle modalen skal brukes.
 */
export const NyOpprettSakFlytContext = createContext<ComponentType<NyOpprettSakFlytProps> | null>(null);

export function useHarNyOpprettSakFlyt() {
    return useContext(NyOpprettSakFlytContext) !== null;
}

type OpprettSakFlytModalProps = Omit<NyOpprettSakFlytProps, "onAvbryt"> & {
    open: boolean;
    onClose: () => void;
};

export function OpprettSakFlytModal({ open, onClose, ...props }: OpprettSakFlytModalProps) {
    const Flyt = useContext(NyOpprettSakFlytContext);
    if (!Flyt || !open) return null;

    return (
        <Modal open onClose={onClose} header={{ heading: "Opprett sak" }} width="70rem">
            <Modal.Body>
                <Suspense fallback={<Loader size="3xlarge" title="Laster..." variant="interaction" />}>
                    <Flyt {...props} onAvbryt={onClose} />
                </Suspense>
            </Modal.Body>
        </Modal>
    );
}
