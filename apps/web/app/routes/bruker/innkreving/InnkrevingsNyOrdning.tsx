import type { NyBetalingsordning } from "@bidrag/api/BidragReskontroApi";
import { Table } from "@navikt/ds-react";
import { InnkrevingsseksjonKort } from "./InnkrevingsseksjonKort";
import { belopEllerStrek, datoEllerStrek } from "./innkrevingsformattering";

type Props = {
    nyBetalingsordning?: NyBetalingsordning | null;
};

export function InnkrevingsNyOrdning({ nyBetalingsordning }: Props) {
    if (!nyBetalingsordning) return null;

    return (
        <InnkrevingsseksjonKort title="Planlagt fremtidig ordning">
            <Table size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Gjelder FOM dato</Table.HeaderCell>
                        <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <Table.Row>
                        <Table.DataCell>{datoEllerStrek(nyBetalingsordning.dato?.fom)}</Table.DataCell>
                        <Table.DataCell align="right">{belopEllerStrek(nyBetalingsordning.beløp)}</Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        </InnkrevingsseksjonKort>
    );
}
