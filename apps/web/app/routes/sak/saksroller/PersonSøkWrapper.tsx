import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyLong, Button, Detail, Heading, HStack, Modal, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { useParams } from "react-router";
import SøkPerson from "./components/SøkPerson.tsx";

interface PersonSøkWrapperProps {
    tittel: string;
    beskrivelse: string;
    søkeLabel: string;
    onPersonValgt: (person: PersonDto) => void;
    onAvbryt: () => void;
    ikon?: ReactNode;
    children?: ReactNode;
}

export default function PersonSøkWrapper({
    tittel,
    beskrivelse,
    søkeLabel,
    onPersonValgt,
    onAvbryt,
    ikon,
    children,
}: PersonSøkWrapperProps) {
    const { saksnummer } = useParams();

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
                <VStack gap="space-16">
                    <BodyLong size="medium">{beskrivelse}</BodyLong>

                    {children}

                    <SøkPerson label={søkeLabel} personInformasjon={(person) => onPersonValgt(person)} compact />
                </VStack>
            </Modal.Body>

            <Modal.Footer>
                <Button type="button" variant="secondary" onClick={onAvbryt}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
