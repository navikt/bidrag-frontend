import { dateToDDMMYYYYString } from "@bidrag/common";
import { Table } from "@navikt/ds-react";

import tekster from "../../../common/constants/texts";
import { useGetBeregningSærbidrag } from "../../../common/hooks/useApiData";
import { dateOrNull } from "../../../utils/date-utils";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";

export const UtgifsposterTable: React.FC = () => {
    const { data: beregnetSærbidrag } = useGetBeregningSærbidrag();

    const utgifstposter = beregnetSærbidrag.resultat.utgiftsposter;
    return (
        <Table size="small" zebraStripes>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell textSize="small">{tekster.label.betaltAvBp}</Table.HeaderCell>
                    <Table.HeaderCell textSize="small">{tekster.label.forfallsdato}</Table.HeaderCell>
                    <Table.HeaderCell textSize="small">{tekster.label.utgift}</Table.HeaderCell>
                    <Table.HeaderCell textSize="small" align="right">
                        {tekster.label.kravbeløp}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" align="right">
                        {tekster.label.godkjentBeløp}
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {utgifstposter.map((utgifspost, rowIndex) => (
                    <Table.Row key={rowIndex} className="pr-[16px]">
                        <Table.DataCell textSize="small" className={"pr-[16px]"}>
                            {utgifspost.betaltAvBp ? "Ja" : "Nei"}
                        </Table.DataCell>
                        <Table.DataCell textSize="small">
                            {dateToDDMMYYYYString(dateOrNull(utgifspost.dato))}
                        </Table.DataCell>
                        <Table.DataCell textSize="small">{utgifspost.utgiftstypeVisningsnavn}</Table.DataCell>
                        <Table.DataCell textSize="small" align="right">
                            {formatterBeløpForBeregning(utgifspost.kravbeløp, true)}
                        </Table.DataCell>
                        <Table.DataCell textSize="small" align="right">
                            {formatterBeløpForBeregning(utgifspost.godkjentBeløp, true)}
                        </Table.DataCell>
                    </Table.Row>
                ))}
                <Table.Row className="border-t border-solid border-black border-b-2 border-l-0 border-r-0">
                    <Table.DataCell textSize="small" className="font-ax-bold" align="right" colSpan={3}>
                        Sum:
                    </Table.DataCell>
                    <Table.DataCell textSize="small" align="right">
                        {formatterBeløpForBeregning(beregnetSærbidrag.resultat.beregning.totalKravbeløp, true)}
                    </Table.DataCell>
                    <Table.DataCell textSize="small" align="right">
                        {formatterBeløpForBeregning(beregnetSærbidrag.resultat.beregning.totalGodkjentBeløp, true)}
                    </Table.DataCell>
                </Table.Row>
            </Table.Body>
        </Table>
    );
};
