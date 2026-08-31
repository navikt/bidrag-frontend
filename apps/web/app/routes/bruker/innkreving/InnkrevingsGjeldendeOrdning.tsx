import type { GjeldendeBetalingsordning } from "@bidrag/api/BidragReskontroApi";
import { Table } from "@navikt/ds-react";
import { InnkrevingsseksjonKort } from "./InnkrevingsseksjonKort";
import { belopEllerStrek, datoEllerStrek, tekstEllerStrek } from "./innkrevingsformattering";

type Props = {
    gjeldendeBetalingsordning?: GjeldendeBetalingsordning | null;
};

export function InnkrevingsGjeldendeOrdning({ gjeldendeBetalingsordning }: Props) {
    if (!gjeldendeBetalingsordning) return null;

    return (
        <InnkrevingsseksjonKort title="Gjeldende ordning">
            <Table size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Type ordning</Table.HeaderCell>
                        <Table.HeaderCell>Fnr/Orgnr betalingskilde</Table.HeaderCell>
                        <Table.HeaderCell>Navn betalingskilde</Table.HeaderCell>
                        <Table.HeaderCell>Siste giro sendt</Table.HeaderCell>
                        <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                        <Table.HeaderCell>Neste forfall</Table.HeaderCell>
                        <Table.HeaderCell>Dato sist endret</Table.HeaderCell>
                        <Table.HeaderCell>Årsak siste endring</Table.HeaderCell>
                        <Table.HeaderCell align="right">Sum ubetalt på ordningen</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <Table.Row>
                        <Table.DataCell>
                            {tekstEllerStrek(gjeldendeBetalingsordning.typeBehandlingsordning)}
                        </Table.DataCell>
                        <Table.DataCell>{tekstEllerStrek(gjeldendeBetalingsordning.kilde)}</Table.DataCell>
                        <Table.DataCell>{tekstEllerStrek(gjeldendeBetalingsordning.kildeNavn)}</Table.DataCell>
                        <Table.DataCell>{datoEllerStrek(gjeldendeBetalingsordning.datoSisteGiro)}</Table.DataCell>
                        <Table.DataCell align="right">
                            {belopEllerStrek(gjeldendeBetalingsordning.beløp)}
                        </Table.DataCell>
                        <Table.DataCell>{datoEllerStrek(gjeldendeBetalingsordning.nesteForfall)}</Table.DataCell>
                        <Table.DataCell>{datoEllerStrek(gjeldendeBetalingsordning.sistEndret)}</Table.DataCell>
                        <Table.DataCell>{tekstEllerStrek(gjeldendeBetalingsordning.sistEndretÅrsak)}</Table.DataCell>
                        <Table.DataCell align="right">
                            {belopEllerStrek(gjeldendeBetalingsordning.sumUbetalt)}
                        </Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        </InnkrevingsseksjonKort>
    );
}
