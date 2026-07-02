import type { FogdhistorikkDto } from "@bidrag/api/SakApi";
import { formaterDato } from "@bidrag/utils";
import { Heading, Table, VStack } from "@navikt/ds-react";
import {EnhetsNavn} from "~/routes/sak/fogdhistorikk/components/EnhetsNavn.tsx";

export default function FogdhistorikkTabell({
    tittel,
    historikk,
}: {
    tittel: string;
    historikk: FogdhistorikkDto[];
}) {

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
                        <Table.HeaderCell scope="col">
                            Opprettet av
                        </Table.HeaderCell>
                        <Table.HeaderCell scope="col">FOM</Table.HeaderCell>
                        <Table.HeaderCell scope="col">TOM</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {historikk.map(h => (
                            <Table.Row key={h.tilgangId}>
                                <Table.DataCell className={"cell"}>
                                    {h.enhetsnummer}
                                </Table.DataCell>
                                <Table.DataCell><EnhetsNavn enhetsnummer={h.enhetsnummer}/></Table.DataCell>
                                <Table.DataCell className={"cell"}>
                                    {h.arsakBeskrivelse}
                                </Table.DataCell>
                                <Table.DataCell className={"cell"}>
                                    {h.opprettetAv}
                                </Table.DataCell>
                                <Table.DataCell className={"cell"}>
                                    {formaterDato(h.tilgangFomDato)}
                                </Table.DataCell>
                                <Table.DataCell className={"cell"}>
                                    {h.tilgangTomDato
                                        ? formaterDato(h.tilgangTomDato)
                                        : ""}
                                </Table.DataCell>
                            </Table.Row>
                        ),
                    )}
                </Table.Body>
            </Table>
        </VStack>
    );
}
