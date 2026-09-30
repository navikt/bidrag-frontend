import { Button, Loader, Modal } from "@navikt/ds-react";
import {
    type ComponentType,
    createContext,
    type MouseEventHandler,
    Suspense,
    useContext,
    useId,
    useState,
} from "react";

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
type ModalSubmit = {
    isLoading: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
};
const NyOpprettSakModalContext = createContext<{
    formId: string;
    setSubmit: (submit: ModalSubmit | null) => void;
} | null>(null);

export function useNyOpprettSakModal() {
    return useContext(NyOpprettSakModalContext);
}

export function useHarNyOpprettSakFlyt() {
    return useContext(NyOpprettSakFlytContext) !== null;
}

type OpprettSakFlytModalProps = Omit<NyOpprettSakFlytProps, "onAvbryt"> & {
    open: boolean;
    onClose: () => void;
};

export function OpprettSakFlytModal({ open, onClose, ...props }: OpprettSakFlytModalProps) {
    const Flyt = useContext(NyOpprettSakFlytContext);
    const [submit, setSubmit] = useState<ModalSubmit | null>(null);
    const formId = useId();
    const sending = submit?.isLoading ?? false;
    const lukkHvisIkkeSender = () => {
        if (!sending) onClose();
    };
    if (!Flyt || !open) return null;

    return (
        <Modal
            open
            portal
            onClose={lukkHvisIkkeSender}
            onBeforeClose={() => !sending}
            onCancel={(event) => {
                if (sending) event.preventDefault();
            }}
            header={{ heading: "Opprett sak", closeButton: !sending }}
            width="70rem"
        >
            <Modal.Body>
                <Suspense fallback={<Loader size="3xlarge" title="Laster..." variant="interaction" />}>
                    <NyOpprettSakModalContext value={{ formId, setSubmit }}>
                        <Flyt {...props} onAvbryt={lukkHvisIkkeSender} />
                    </NyOpprettSakModalContext>
                </Suspense>
            </Modal.Body>
            {submit && (
                <Modal.Footer>
                    <Button
                        variant="primary"
                        type="submit"
                        form={formId}
                        size="xsmall"
                        loading={sending}
                        onClick={submit.onClick}
                    >
                        Opprett
                    </Button>
                    <Button
                        variant="secondary"
                        type="button"
                        size="xsmall"
                        disabled={sending}
                        onClick={lukkHvisIkkeSender}
                    >
                        Avbryt
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
}
