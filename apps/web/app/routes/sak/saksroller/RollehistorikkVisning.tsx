import { dateToDDMMYYYYString } from "@bidrag/common";
import { ReadMore, Table } from "@navikt/ds-react";
import { useState } from "react";

import type { Rolle, Rollehistorikk } from "./sakvisning-schema.ts";

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

    //<ClockDashedIcon aria-hidden fontSize="1.5rem" />
    return (
        <ReadMore header="Vis rollehistorikk">
            <Table size="small" className="w-full">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textSize="small" scope="col">
                            Ny RM
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" scope="col">
                            Type
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" scope="col">
                            Endret
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
                            <Table.DataCell>{historikk.typeEndring}</Table.DataCell>
                            <Table.DataCell textSize="small">{`${historikk.opprettetAv || "-"}`}</Table.DataCell>
                            <Table.DataCell textSize="small">
                                {historikk.opprettetDato ? `  ${dateToDDMMYYYYString(historikk.opprettetDato)}` : " -"}
                            </Table.DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </ReadMore>
    );
}
