import type { GjeldendeBetalingsordning } from "@bidrag/api/BidragReskontroApi";
import { Box, HStack, Table } from "@navikt/ds-react";
import { InnkrevingsseksjonKort } from "./InnkrevingsseksjonKort";
import { belopEllerStrek, datoEllerStrek, tekstEllerStrek } from "./innkrevingsformattering";

type Props = {
    gjeldendeBetalingsordning?: GjeldendeBetalingsordning | null;
};

const KvTabell = ({ children }: { children: React.ReactNode }) => (
    <Box
        asChild
        background="default"
        borderColor="neutral-subtle"
        padding="space-16"
        borderWidth="1"
        borderRadius="4"
        width="fit-content"
    >
        <Table size="small">
            <Table.Body>{children}</Table.Body>
        </Table>
    </Box>
);

export function InnkrevingsGjeldendeOrdning({ gjeldendeBetalingsordning }: Props) {
    if (!gjeldendeBetalingsordning) return null;

    return (
        <InnkrevingsseksjonKort title="Gjeldende ordning">
            <HStack gap="space-8" align="start" wrap={false}>
                <KvTabell>
                    <Table.Row>
                        <Table.DataCell>Type ordning</Table.DataCell>
                        <Table.DataCell align="right">
                            {tekstEllerStrek(gjeldendeBetalingsordning.typeBehandlingsordning)}
                        </Table.DataCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.DataCell>Fnr/Orgnr betalingskilde</Table.DataCell>
                        <Table.DataCell align="right">
                            {tekstEllerStrek(gjeldendeBetalingsordning.kilde)}
                        </Table.DataCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.DataCell>Navn betalingskilde</Table.DataCell>
                        <Table.DataCell align="right">
                            {tekstEllerStrek(gjeldendeBetalingsordning.kildeNavn)}
                        </Table.DataCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.DataCell>Siste giro sendt</Table.DataCell>
                        <Table.DataCell align="right">
                            {datoEllerStrek(gjeldendeBetalingsordning.datoSisteGiro)}
                        </Table.DataCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.DataCell>Beløp</Table.DataCell>
                        <Table.DataCell align="right">
                            {belopEllerStrek(gjeldendeBetalingsordning.beløp)}
                        </Table.DataCell>
                    </Table.Row>
                </KvTabell>
                <KvTabell>
                    <Table.Row>
                        <Table.DataCell>Neste forfall</Table.DataCell>
                        <Table.DataCell align="right">
                            {datoEllerStrek(gjeldendeBetalingsordning.nesteForfall)}
                        </Table.DataCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.DataCell>Dato sist endret</Table.DataCell>
                        <Table.DataCell align="right">
                            {datoEllerStrek(gjeldendeBetalingsordning.sistEndret)}
                        </Table.DataCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.DataCell>Årsak siste endring</Table.DataCell>
                        <Table.DataCell align="right">
                            {tekstEllerStrek(gjeldendeBetalingsordning.sistEndretÅrsak)}
                        </Table.DataCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.DataCell>Sum ubetalt på ordningen</Table.DataCell>
                        <Table.DataCell align="right">
                            {belopEllerStrek(gjeldendeBetalingsordning.sumUbetalt)}
                        </Table.DataCell>
                    </Table.Row>
                </KvTabell>
            </HStack>
        </InnkrevingsseksjonKort>
    );
}
