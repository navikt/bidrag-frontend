import { Button, Detail, Heading, HStack, Modal, VStack } from "@navikt/ds-react";
import { useParams } from "react-router";
import type { PersonSøkRammeProps } from "./PersonSøkWrapper.tsx";

export default function PersonSøkModal({
    tittel,
    onAvbryt,
    ikon,
    saksnummer,
    actions,
    children,
}: PersonSøkRammeProps & { saksnummer?: string }) {
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
            <Modal.Body>{children}</Modal.Body>
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
