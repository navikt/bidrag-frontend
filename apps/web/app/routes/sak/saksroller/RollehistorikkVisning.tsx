import { dateToDDMMYYYYString } from "@bidrag/common";
import { Button, Table } from "@navikt/ds-react";
import { useState } from "react";

import type { Rollehistorikk } from "./sakvisning-schema.ts";

type Props = {
    rollehistorikk?: Rollehistorikk[];
};

export default function RollehistorikkVisning({ rollehistorikk }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    if (!rollehistorikk || rollehistorikk.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Button size="small" type="button" variant="tertiary" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? "Skjul rollehistorikk" : "Vis rollehistorikk"}
                </Button>
            </div>
            {isOpen && (
                <Table size="small" className="w-full" bgcolor="white">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell textSize="small" scope="col" className="w-1/5">
                                Nytt reell mottaker
                            </Table.HeaderCell>
                            <Table.HeaderCell textSize="small" scope="col" className="w-1/5">
                                Type endring
                            </Table.HeaderCell>
                            <Table.HeaderCell textSize="small" scope="col" className="w-1/5">
                                Endret av
                            </Table.HeaderCell>
                            <Table.HeaderCell textSize="small" scope="col" className="w-1/5">
                                Endret dato
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {[...rollehistorikk]
                            .sort((a, b) =>
                                a.opprettetDato && b.opprettetDato
                                    ? b.opprettetDato.getTime() - a.opprettetDato.getTime()
                                    : 0,
                            )
                            .map((rolle, index) => (
                                <Table.Row key={index}>
                                    <Table.DataCell textSize="small">{rolle.reellMottaker || "-"}</Table.DataCell>
                                    <Table.DataCell textSize="small">{rolle.typeEndring || "-"}</Table.DataCell>
                                    <Table.DataCell textSize="small">{rolle.opprettetAv || "-"}</Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        {rolle.opprettetDato ? dateToDDMMYYYYString(rolle.opprettetDato) : "-"}
                                    </Table.DataCell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table>
            )}
        </div>
    );
}
