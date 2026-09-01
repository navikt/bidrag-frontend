import type { Innkrevingssakshistorikk } from "@bidrag/api/BidragReskontroApi";
import { PersonNavnIdent } from "@bidrag/common";
import { BodyLong, Box, Table } from "@navikt/ds-react";
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
                                <Table.HeaderCell>Dato</Table.HeaderCell>
                                <Table.HeaderCell>Navn og fnr/orgnr </Table.HeaderCell>
                                <Table.HeaderCell>Beskrivelse</Table.HeaderCell>
                                <Table.HeaderCell align="right">Beløp</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {historikkListe.map((innslag, index) => (
                                <Table.Row key={`${innslag.dato ?? "ingen-dato"}-${index}`}>
                                    <Table.DataCell>{datoEllerStrek(innslag.dato)}</Table.DataCell>
                                    <Table.DataCell>
                                        {innslag.ident && (
                                            <PersonNavnIdent ident={innslag.ident} navn={innslag.navn ?? undefined} />
                                        )}
                                    </Table.DataCell>
                                    <Table.DataCell>{tekstEllerStrek(innslag.beskrivelse)}</Table.DataCell>
                                    <Table.DataCell align="right">{belopEllerStrek(innslag.beløp)}</Table.DataCell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </Box>
            )}
        </InnkrevingsseksjonKort>
    );
}
