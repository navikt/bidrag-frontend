import type { Innkrevingssakshistorikk } from "@bidrag/api/BidragReskontroApi";
import { BodyLong, Table } from "@navikt/ds-react";
import { InnkrevingsseksjonKort } from "./InnkrevingsseksjonKort";
import { belopEllerStrek, datoEllerStrek, tekstEllerStrek } from "./innkrevingsformattering";

type Props = {
    historikk?: Innkrevingssakshistorikk[] | null;
};

export function InnkrevingsHistorikk({ historikk }: Props) {
    const historikkListe = historikk ?? [];

    return (
        <InnkrevingsseksjonKort title="Historikk innkrevingsaktiviteter">
            {historikkListe.length === 0 ? (
                <BodyLong>Ingen historikk funnet.</BodyLong>
            ) : (
                <Table size="small">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Dato</Table.HeaderCell>
                            <Table.HeaderCell>Fnr/Orgnr</Table.HeaderCell>
                            <Table.HeaderCell>Navn</Table.HeaderCell>
                            <Table.HeaderCell>Beskrivelse</Table.HeaderCell>
                            <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {historikkListe.map((innslag, index) => (
                            <Table.Row key={`${innslag.dato ?? "ingen-dato"}-${index}`}>
                                <Table.DataCell>{datoEllerStrek(innslag.dato)}</Table.DataCell>
                                <Table.DataCell>{tekstEllerStrek(innslag.ident)}</Table.DataCell>
                                <Table.DataCell>{tekstEllerStrek(innslag.navn)}</Table.DataCell>
                                <Table.DataCell>{tekstEllerStrek(innslag.beskrivelse)}</Table.DataCell>
                                <Table.DataCell align="right">{belopEllerStrek(innslag.beløp)}</Table.DataCell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}
        </InnkrevingsseksjonKort>
    );
}
