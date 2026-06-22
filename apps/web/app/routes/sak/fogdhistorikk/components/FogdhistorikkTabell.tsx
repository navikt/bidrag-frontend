import "./FogdhistorikkTabell.css";

import { Heading, Table, VStack } from "@navikt/ds-react";

import { useHentEnhetInfomasjon } from "../../useApi.ts";
import { formaterDato } from "@bidrag/utils";
import type {FogdhistorikkDto} from "@bidrag/api/SakApi";

export default function FogdhistorikkTabell({ tittel, historikk }: { tittel: string; historikk: FogdhistorikkDto[] }) {
    const mappedHistorikk = historikk.map((h) => {
        return { ...h, enhetsnavn: useHentEnhetInfomasjon(h.enhetsnummer).data?.navn };
    });
    return (
        <VStack gap={"space-16"} className={"fogdhistorikk-tabell"}>
            <Heading size={"medium"} as={"h2"}>
                {tittel}
            </Heading>
            <Table zebraStripes size={"small"}>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell scope="col">Enhet</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Navn</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Årsak</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Opprettet av</Table.HeaderCell>
                        <Table.HeaderCell scope="col">FOM</Table.HeaderCell>
                        <Table.HeaderCell scope="col">TOM</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {mappedHistorikk.map(
                        ({
                            tilgangId,
                            enhetsnummer,
                            enhetsnavn,
                            arsakBeskrivelse,
                            opprettetAv,
                            tilgangFomDato,
                            tilgangTomDato,
                        }) => (
                            <Table.Row key={tilgangId}>
                                <Table.DataCell className={"cell"}>{enhetsnummer}</Table.DataCell>
                                <Table.DataCell>{enhetsnavn}</Table.DataCell>
                                <Table.DataCell className={"cell"}>{arsakBeskrivelse}</Table.DataCell>
                                <Table.DataCell className={"cell"}>{opprettetAv}</Table.DataCell>
                                <Table.DataCell className={"cell"}>{formaterDato(tilgangFomDato)}</Table.DataCell>
                                <Table.DataCell className={"cell"}>
                                    {tilgangTomDato ? formaterDato(tilgangTomDato) : ""}
                                </Table.DataCell>
                            </Table.Row>
                        )
                    )}
                </Table.Body>
            </Table>
        </VStack>
    );
}
