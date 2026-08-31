import type { Skyldnerinformasjon } from "@bidrag/api/BidragReskontroApi";
import { Box, Table } from "@navikt/ds-react";
import { InnkrevingsseksjonKort } from "./InnkrevingsseksjonKort";
import { belopEllerStrek, tekstEllerStrek } from "./innkrevingsformattering";

type Props = {
    ident: string;
    skyldnerinformasjon?: Skyldnerinformasjon | null;
};

export function InnkrevingsToppseksjon({ skyldnerinformasjon }: Props) {
    return (
        <InnkrevingsseksjonKort title="Innkrevingsstatus">
            <Box
                asChild
                background="default"
                borderColor="neutral-subtle"
                padding="space-16"
                borderWidth="1"
                borderRadius="4"
            >
                <Table size="small">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Status innkreving</Table.HeaderCell>
                            <Table.HeaderCell>Siste aktivitet</Table.HeaderCell>
                            <Table.HeaderCell>Betalingsmåte</Table.HeaderCell>
                            <Table.HeaderCell align="right">Påløp</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        <Table.Row>
                            <Table.DataCell>
                                {tekstEllerStrek(skyldnerinformasjon?.innkrevingssaksstatus)}
                            </Table.DataCell>
                            <Table.DataCell>{tekstEllerStrek(skyldnerinformasjon?.sisteAktivitet)}</Table.DataCell>
                            <Table.DataCell>{tekstEllerStrek(skyldnerinformasjon?.fakturamåte)}</Table.DataCell>
                            <Table.DataCell align="right">
                                {belopEllerStrek(skyldnerinformasjon?.sumLøpendeBidrag)}
                            </Table.DataCell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </Box>
        </InnkrevingsseksjonKort>
    );
}
