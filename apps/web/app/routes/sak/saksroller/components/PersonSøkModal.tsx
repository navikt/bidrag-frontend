import { Button, Detail, Heading, HStack, Modal, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { PersonSøkInnhold, type PersonSøkInnholdProps } from "./PersonSøkWrapper.tsx";

interface PersonSøkModalProps extends PersonSøkInnholdProps {
    tittel: string;
    onAvbryt: () => void;
    ikon?: ReactNode;
    saksnummer?: string;
    actions?: ReactNode;
}

export default function PersonSøkModal({
    tittel,
    onAvbryt,
    ikon,
    saksnummer,
    actions,
    ...innholdProps
}: PersonSøkModalProps) {
    return (
        <Modal open onClose={onAvbryt} width="medium" aria-label={tittel}>
            <Modal.Header>
                <VStack gap="space-2">
                    {saksnummer && <Detail>Sak {saksnummer}</Detail>}
                    <HStack gap="space-4" align="center" wrap={false}>
                        {ikon}
                        <Heading level="2" size="medium">
                            {tittel}
                        </Heading>
                    </HStack>
                </VStack>
            </Modal.Header>
            <Modal.Body>
                <PersonSøkInnhold {...innholdProps} />
            </Modal.Body>
            <Modal.Footer>
                {actions ?? (
                    <Button type="button" size="small" variant="secondary" onClick={onAvbryt}>
                        Avbryt
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}
