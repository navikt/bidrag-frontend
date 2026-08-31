import type { NyBetalingsordning } from "@bidrag/api/BidragReskontroApi";
import { Box, Table } from "@navikt/ds-react";
import { InnkrevingsseksjonKort } from "./InnkrevingsseksjonKort";
import { belopEllerStrek, datoEllerStrek } from "./innkrevingsformattering";

type Props = {
    nyBetalingsordning?: NyBetalingsordning | null;
};

export function InnkrevingsNyOrdning({ nyBetalingsordning }: Props) {
    if (!nyBetalingsordning) return null;

    return (
        <InnkrevingsseksjonKort title="Planlagt fremtidig ordning">
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
                    <Table.Body>
                        <Table.Row>
                            <Table.DataCell>Gjelder FOM dato</Table.DataCell>
                            <Table.DataCell align="right">
                                {datoEllerStrek(nyBetalingsordning.dato?.fom)}
                            </Table.DataCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.DataCell>Beløp</Table.DataCell>
                            <Table.DataCell align="right">{belopEllerStrek(nyBetalingsordning.beløp)}</Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </InnkrevingsseksjonKort>
    );
}
