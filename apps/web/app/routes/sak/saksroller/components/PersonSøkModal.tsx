import { Button, Detail, Heading, HStack, Modal, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useParams } from "react-router";
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
    const { saksnummer: saksnummerFraRute } = useParams();
    const sak = saksnummer ?? saksnummerFraRute;

    return (
        <Modal open onClose={onAvbryt} width="medium" aria-label={tittel}>
            <Modal.Header>
                <VStack gap="space-2">
                    {sak && <Detail>Sak {sak}</Detail>}
                    <HStack gap="space-4" align="center" wrap={false}>
                        {ikon}
                        <Heading level="2" size="small">
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
