import { dateToDDMMYYYYString } from "@bidrag/common";
import { ClockDashedIcon, ExternalLinkIcon } from "@navikt/aksel-icons";
import { Box, Button, Detail, Heading, HStack, Modal, Table, VStack } from "@navikt/ds-react";
import { useState } from "react";

import PersonInfo from "../felles/person/PersonInfo.tsx";
import type { Rolle, Rollehistorikk } from "../felles/sakvisning-schema.ts";

type Props = {
    rollehistorikk?: Rollehistorikk[];
    rolle?: Pick<Rolle, "navn" | "fodselsnummer" | "fødselsdato" | "type">;
    saksnummer?: string;
};

export default function RollehistorikkVisning({ rollehistorikk, rolle, saksnummer }: Props) {
    const [isOpen, setIsOpen] = useState(false);

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
                    <Modal.Header closeButton>
                        <VStack gap="space-2">
                            {saksnummer && <Detail>Sak {saksnummer}</Detail>}
                            <HStack gap="space-4" align="center" wrap={false}>
                                <ClockDashedIcon aria-hidden />
                                <Heading level="2" size="small">
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

                            <Table size="small" className="w-full">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell textSize="small" scope="col">
                                            Ny reell mottaker
                                        </Table.HeaderCell>
                                        <Table.HeaderCell textSize="small" scope="col">
                                            Type endring
                                        </Table.HeaderCell>
                                        <Table.HeaderCell textSize="small" scope="col">
                                            Endret av
                                        </Table.HeaderCell>
                                        <Table.HeaderCell textSize="small" scope="col">
                                            Dato
                                        </Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {sortertHistorikk.map((historikk, index) => (
                                        <Table.Row key={index}>
                                            <Table.DataCell textSize="small">
                                                <span className="personident">{historikk.reellMottaker || "-"}</span>
                                            </Table.DataCell>
                                            <Table.DataCell textSize="small">
                                                {historikk.typeEndring || "-"}
                                            </Table.DataCell>
                                            <Table.DataCell textSize="small">
                                                {historikk.opprettetAv || "-"}
                                            </Table.DataCell>
                                            <Table.DataCell textSize="small">
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
