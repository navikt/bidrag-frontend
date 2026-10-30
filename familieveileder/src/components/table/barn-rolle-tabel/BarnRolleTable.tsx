import { Table } from "@navikt/ds-react";
import React from "react";

import { HEADER } from "../../../constants/table";
import { IBarnRolleTableData } from "../../../types/table";
import RoleSelect, { ISelectData } from "../../select/role-select/RoleSelect";

interface IBarnRolleTableProps {
    tableData: IBarnRolleTableData[];
    onSelectRole: (data: ISelectData) => void;
}

export default function BarnRolleTable({ tableData, onSelectRole }: IBarnRolleTableProps) {
    return (
        <Table size="small" data-testid="test-barn-rolle-table">
            <Table.Header className="bg-ax-neutral-200 text-ax-neutral-900">
                <Table.Row>
                    {HEADER.FAMILIERELASJON.slice(1).map((header, index) => {
                        return (
                            <Table.HeaderCell key={index} scope="col">
                                {header}
                            </Table.HeaderCell>
                        );
                    })}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {tableData.map((data, index) => {
                    return (
                        <Table.Row key={index}>
                            <Table.DataCell>
                                <RoleSelect
                                    key={index}
                                    name={data.visningsnavn}
                                    defaultValue={data.rolle}
                                    onSelectRole={onSelectRole}
                                    className="w-[5rem]"
                                />
                            </Table.DataCell>
                            <Table.DataCell>{data.relasjon}</Table.DataCell>
                            <Table.DataCell>{data.fodselsnummer}</Table.DataCell>
                            <Table.DataCell>{data.visningsnavn}</Table.DataCell>
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table>
    );
}
