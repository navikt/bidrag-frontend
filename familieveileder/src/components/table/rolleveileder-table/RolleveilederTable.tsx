import { Table } from "@navikt/ds-react";
import React from "react";

import { HEADER } from "../../../constants/table";
import { RolleType } from "../../../types/rolleveileder";

interface IRolleveilederTableProps {
    rolle: RolleType;
    fodselsnummer: string;
    navn: string;
}

export default function RolleveilederTable({ rolle, fodselsnummer, navn }: IRolleveilederTableProps) {
    return (
        <Table size="small">
            <Table.Header className="bg-ax-neutral-200 text-ax-neutral-900">
                <Table.Row>
                    {HEADER.ROLLEVEILEDER.map((header, index) => {
                        return (
                            <Table.HeaderCell key={index} scope="col">
                                {header}
                            </Table.HeaderCell>
                        );
                    })}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    <Table.HeaderCell scope="row">{rolle}</Table.HeaderCell>
                    <Table.DataCell>{fodselsnummer}</Table.DataCell>
                    <Table.DataCell>{navn}</Table.DataCell>
                </Table.Row>
            </Table.Body>
        </Table>
    );
}
