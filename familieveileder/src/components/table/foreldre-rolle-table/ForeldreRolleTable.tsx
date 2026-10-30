import { Checkbox, Table } from "@navikt/ds-react";
import { ChangeEvent, useEffect, useState } from "react";
import React from "react";

import { HEADER } from "../../../constants/table";
import { FamileenhetDto } from "../../../types/personsearch";
import { RolleType, Rolleveileder } from "../../../types/rolleveileder";
import { IFamilierelasjonTableData } from "../../../types/table";
import createFamilierelasjonData from "./ForeldreRolleTableUtils";

interface IForeldreRolleTableDataProps {
    rolleType: RolleType;
    familieenhet: FamileenhetDto;
    valgteRoller: Rolleveileder;
    onSelect: (data: IFamilierelasjonTableData[]) => void;
}

export default function ForeldreRolleTable({
    rolleType,
    familieenhet,
    valgteRoller,
    onSelect,
}: IForeldreRolleTableDataProps) {
    const [roleTableData, setRoleTableData] = useState<IFamilierelasjonTableData[]>();

    useEffect(() => {
        const familierelasjonTableData = createFamilierelasjonData(rolleType, familieenhet, valgteRoller);
        setRoleTableData(familierelasjonTableData);
        onSelect(getSelectedRole(familierelasjonTableData));
    }, [familieenhet, valgteRoller, rolleType]);

    if (!roleTableData) {
        return null;
    }

    function getSelectedRole(rolle: IFamilierelasjonTableData[]): IFamilierelasjonTableData[] {
        return rolle.filter((relasjon) => relasjon.isChecked);
    }

    function handleCheckbox({ target }: ChangeEvent<HTMLInputElement>): void {
        const selected = roleTableData.map((relasjon) => {
            if (relasjon.fodselsnummer === target.value) {
                return { ...relasjon, isChecked: !relasjon.isChecked };
            }

            return { ...relasjon };
        }) as IFamilierelasjonTableData[];

        setRoleTableData(selected);
        onSelect(getSelectedRole(selected));
    }

    function handleSelectAll(): void {
        const selected = roleTableData.map((relasjon) => {
            return { ...relasjon, isChecked: !isAllChecked() };
        }) as IFamilierelasjonTableData[];

        setRoleTableData(selected);
        onSelect(getSelectedRole(selected));
    }

    function isAllChecked(): boolean {
        return roleTableData.every((data) => data.isChecked);
    }

    return (
        <div>
            <Checkbox
                data-testid="test-foreldre-rolle-table-select-all"
                size="small"
                onChange={handleSelectAll}
                value="all"
                checked={isAllChecked()}
            >
                Velg alle
            </Checkbox>
            <Table size="small">
                <Table.Header className="bg-ax-neutral-200 text-ax-neutral-900">
                    <Table.Row>
                        {HEADER.FAMILIERELASJON.map((header, index) => {
                            return (
                                <Table.HeaderCell key={index} scope="col">
                                    {header}
                                </Table.HeaderCell>
                            );
                        })}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {roleTableData.map((person, index) => {
                        return (
                            <Table.Row key={index}>
                                <Table.DataCell className="w-1">
                                    <Checkbox
                                        hideLabel
                                        size="small"
                                        value={person.fodselsnummer}
                                        checked={person.isChecked}
                                        onChange={handleCheckbox}
                                        name="fodselsnummer"
                                        type="checkbox"
                                        data-testid="test-foreldre-rolle-table-select"
                                    >
                                        {`Velg ${person.visningsnavn}`}
                                    </Checkbox>
                                </Table.DataCell>
                                <Table.DataCell>{person.rolle}</Table.DataCell>
                                <Table.DataCell>{person.relasjon}</Table.DataCell>
                                <Table.DataCell>{person.fodselsnummer}</Table.DataCell>
                                <Table.DataCell>{person.visningsnavn}</Table.DataCell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table>
        </div>
    );
}
