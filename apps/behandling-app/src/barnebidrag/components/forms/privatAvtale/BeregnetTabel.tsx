import type { BeregnetPrivatAvtalePeriodeDto } from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Table } from "@navikt/ds-react";
import React from "react";
import text from "../../../../common/constants/texts";
import { DateToDDMMYYYYString, dateOrNull, deductDays } from "../../../../utils/date-utils";
import { formatterBeløpForBeregning, formatterProsent } from "../../../../utils/number-utils";

export const BeregnetTabel = ({ perioder }: { perioder: BeregnetPrivatAvtalePeriodeDto[] }) => {
    return (
        <Table size="small" className="table-fixed table bg-[white] w-full">
            <Table.Header>
                <Table.Row className="align-baseline">
                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                        {text.label.fraOgMed}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                        {text.label.tilOgMed}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" align="right" className="w-[134px]">
                        {text.label.indeksprosent}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" align="right">
                        {text.label.beløp}
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {perioder.map((periode, index) => (
                    <Table.Row key={`${index}-periode`} className="align-top">
                        <Table.DataCell>
                            <BodyShort size="small">{DateToDDMMYYYYString(dateOrNull(periode.periode.fom))}</BodyShort>
                        </Table.DataCell>
                        <Table.DataCell>
                            <BodyShort size="small">
                                {DateToDDMMYYYYString(
                                    dateOrNull(periode.periode.til)
                                        ? deductDays(dateOrNull(periode.periode.til), 1)
                                        : null,
                                )}
                            </BodyShort>
                        </Table.DataCell>
                        <Table.DataCell align="right">
                            <BodyShort size="small">{formatterProsent(periode.indeksprosent)}</BodyShort>
                        </Table.DataCell>
                        <Table.DataCell align="right">
                            <BodyShort size="small">{formatterBeløpForBeregning(periode.beløp)}</BodyShort>
                        </Table.DataCell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
};
