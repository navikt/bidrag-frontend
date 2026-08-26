import { dateToDDMMYYYYString } from "@bidrag/common";
import { ClockDashedIcon, ExternalLinkIcon } from "@navikt/aksel-icons";
import { Box, Button, Detail, Heading, HStack, Modal, Table, VStack } from "@navikt/ds-react";
import { useState } from "react";
import { useParams } from "react-router";

import PersonInfo from "./components/PersonInfo.tsx";
import type { Rolle, Rollehistorikk } from "./sakvisning-schema.ts";

type Props = {
    rollehistorikk?: Rollehistorikk[];
    rolle?: Pick<Rolle, "navn" | "fodselsnummer" | "fødselsdato" | "type">;
};

export default function RollehistorikkVisning({ rollehistorikk, rolle }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const { saksnummer } = useParams();

    if (!rollehistorikk || rollehistorikk.length === 0) {
        return null;
    }

    const sortertHistorikk = [...rollehistorikk].sort((a, b) =>
        a.opprettetDato && b.opprettetDato ? b.opprettetDato.getTime() - a.opprettetDato.getTime() : 0,
    );

    return (
        <>
            <Button
                size="small"
                type="button"
                variant="tertiary"
                icon={<ExternalLinkIcon aria-hidden />}
                onClick={() => setIsOpen(true)}
                className="self-start"
            >
                Vis rollehistorikk
            </Button>

            {isOpen && (
                <Modal open onClose={() => setIsOpen(false)} width="medium" aria-label="Rollehistorikk">
                    <Modal.Header>
                        <VStack gap="space-2">
                            {saksnummer && <Detail>Sak {saksnummer}</Detail>}
                            <HStack gap="space-4" align="center" wrap={false}>
                                <ClockDashedIcon aria-hidden fontSize="1.5rem" />
                                <Heading level="2" size="medium">
                                    Rollehistorikk
                                </Heading>
                            </HStack>
                        </VStack>
                    </Modal.Header>
                    <Modal.Body>
                        <VStack gap="space-16">
                            {rolle?.fodselsnummer && (
                                <Box
                                    background="raised"
                                    borderColor="neutral-subtleA"
                                    borderWidth="1"
                                    borderRadius="12"
                                    padding="space-12"
                                >
                                    <PersonInfo
                                        navn={rolle.navn}
                                        ident={rolle.fodselsnummer}
                                        fødselsdato={rolle.fødselsdato}
                                        rolle={rolle.type}
                                    />
                                </Box>
                            )}

                            <Table size="medium" className="w-full">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell textSize="medium" scope="col">
                                            Ny reell mottaker
                                        </Table.HeaderCell>
                                        <Table.HeaderCell textSize="medium" scope="col">
                                            Type endring
                                        </Table.HeaderCell>
                                        <Table.HeaderCell textSize="medium" scope="col">
                                            Endret av
                                        </Table.HeaderCell>
                                        <Table.HeaderCell textSize="medium" scope="col">
                                            Dato
                                        </Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {sortertHistorikk.map((historikk, index) => (
                                        <Table.Row key={index}>
                                            <Table.DataCell textSize="medium">
                                                <span className="personident">{historikk.reellMottaker || "-"}</span>
                                            </Table.DataCell>
                                            <Table.DataCell textSize="medium">
                                                {historikk.typeEndring || "-"}
                                            </Table.DataCell>
                                            <Table.DataCell textSize="medium">
                                                {historikk.opprettetAv || "-"}
                                            </Table.DataCell>
                                            <Table.DataCell textSize="medium">
                                                {historikk.opprettetDato
                                                    ? dateToDDMMYYYYString(historikk.opprettetDato)
                                                    : "-"}
                                            </Table.DataCell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </VStack>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
}
