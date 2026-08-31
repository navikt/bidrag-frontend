import type { Skyldnerinformasjon } from "@bidrag/api/BidragReskontroApi";
import { PersonNavn } from "@bidrag/common";
import { Table } from "@navikt/ds-react";
import { InnkrevingsseksjonKort } from "./InnkrevingsseksjonKort";
import { belopEllerStrek, tekstEllerStrek } from "./innkrevingsformattering";

type Props = {
    ident: string;
    skyldnerinformasjon?: Skyldnerinformasjon | null;
};

export function InnkrevingsToppseksjon({ ident, skyldnerinformasjon }: Props) {
    return (
        <InnkrevingsseksjonKort title="Innkrevingsstatus">
            <Table size="small">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Fødselsnummer</Table.HeaderCell>
                        <Table.HeaderCell>Navn</Table.HeaderCell>
                        <Table.HeaderCell>Status innkreving</Table.HeaderCell>
                        <Table.HeaderCell>Siste aktivitet</Table.HeaderCell>
                        <Table.HeaderCell>Betalingsmåte</Table.HeaderCell>
                        <Table.HeaderCell align="right">Påløp</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <Table.Row>
                        <Table.DataCell>{ident}</Table.DataCell>
                        <Table.DataCell>
                            <PersonNavn ident={ident} />
                        </Table.DataCell>
                        <Table.DataCell>{tekstEllerStrek(skyldnerinformasjon?.innkrevingssaksstatus)}</Table.DataCell>
                        <Table.DataCell>{tekstEllerStrek(skyldnerinformasjon?.sisteAktivitet)}</Table.DataCell>
                        <Table.DataCell>{tekstEllerStrek(skyldnerinformasjon?.fakturamåte)}</Table.DataCell>
                        <Table.DataCell align="right">
                            {belopEllerStrek(skyldnerinformasjon?.sumLøpendeBidrag)}
                        </Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        </InnkrevingsseksjonKort>
    );
}
