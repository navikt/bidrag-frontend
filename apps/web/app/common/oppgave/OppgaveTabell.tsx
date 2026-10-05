import type { Beskrivelseinnslag, BidragOppgaveDto } from "@bidrag/api/BidragOppgaveApi";
import { MaskerSensitivInfo, PersonIdent } from "@bidrag/common";
import { formaterDato } from "@bidrag/utils/datoUtils";
import { BodyLong, Box, Detail, HStack, Label, Link, List, Table, VStack } from "@navikt/ds-react";
import { ListItem } from "@navikt/ds-react/List";
import { Link as RouterLink } from "react-router";

interface OppgaveTabellProps {
    oppgaver: BidragOppgaveDto[];
}

const tidspunktFormat = new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "short",
    timeStyle: "short",
});

function BeskrivelseListe({ innslag }: { innslag?: Beskrivelseinnslag[] | null }) {
    if (!innslag?.length) return <p>Ingen beskrivelser</p>;

    return (
        <VStack as="ol" gap="space-16" padding="space-16">
            {innslag.map((beskrivelse, indeks) => (
                <VStack gap="space-4" key={`${beskrivelse.tidspunkt ?? "uten-tidspunkt"}-${indeks}`}>
                    <HStack gap="space-8" align={"center"}>
                        <Label className="font-semibold">
                            {beskrivelse.tidspunkt && (
                                <time dateTime={beskrivelse.tidspunkt}>
                                    {tidspunktFormat.format(new Date(beskrivelse.tidspunkt))}
                                </time>
                            )}
                        </Label>
                        <Detail as={"span"}>
                            {beskrivelse.saksbehandlerNavn}{" "}
                            {(beskrivelse.enhetsnr || beskrivelse.saksbehandlerId) && (
                                <>
                                    {" "}
                                    ({beskrivelse.saksbehandlerId} {beskrivelse.enhetsnr})
                                </>
                            )}
                        </Detail>
                    </HStack>
                    {beskrivelse.kommentar && <BodyLong>{beskrivelse.kommentar}</BodyLong>}
                    {beskrivelse.endringer.length > 0 && (
                        <List aria-label="Endringer">
                            {beskrivelse.endringer.map((endring, endringsindeks) => (
                                <ListItem key={`${endring}-${endringsindeks}`}>{endring}</ListItem>
                            ))}
                        </List>
                    )}
                </VStack>
            ))}
        </VStack>
    );
}

export function OppgaveTabell({ oppgaver }: OppgaveTabellProps) {
    if (oppgaver.length === 0) return <p>Ingen oppgaver</p>;

    return (
        <Box >
            <Table size="small">
                <caption className="sr-only">Oppgaver</caption>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell scope="col">Id</Table.HeaderCell>
                        <Table.HeaderCell scope="col">
                            <span className="sr-only">Beskrivelser</span>
                        </Table.HeaderCell>
                        <Table.HeaderCell scope="col">Oppgavetype</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Enhet</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Frist</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Saksbehandler</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Sak</Table.HeaderCell>
                        <Table.HeaderCell scope="col">Bruker</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {oppgaver.map((oppgave) => (
                        <Table.ExpandableRow
                            key={oppgave.id}
                            colSpan={7}
                            content={
                                <MaskerSensitivInfo>
                                    <BeskrivelseListe innslag={oppgave.beskrivelseListe} />
                                </MaskerSensitivInfo>
                            }
                        >
                            <Table.HeaderCell scope="row">{oppgave.id}</Table.HeaderCell>
                            <Table.HeaderCell scope="row">{oppgave.oppgavetype}</Table.HeaderCell>
                            <Table.DataCell>{oppgave.tildeltEnhetsnr}</Table.DataCell>
                            <Table.DataCell>{formaterDato(oppgave.fristFerdigstillelse)}</Table.DataCell>
                            <Table.DataCell>{oppgave.tilordnetRessurs || "-"}</Table.DataCell>
                            <Table.DataCell>
                                {oppgave.saksreferanse ? (
                                    <Link
                                        as={RouterLink}
                                        to={`/sak/${encodeURIComponent(oppgave.saksreferanse)}/saksroller`}
                                    >
                                        {oppgave.saksreferanse}
                                    </Link>
                                ) : (
                                    "-"
                                )}
                            </Table.DataCell>
                            <Table.DataCell>
                                {oppgave.brukerFnr ? (
                                    <MaskerSensitivInfo>
                                        <PersonIdent ident={oppgave.brukerFnr} />
                                    </MaskerSensitivInfo>
                                ) : (
                                    "-"
                                )}
                            </Table.DataCell>
                        </Table.ExpandableRow>
                    ))}
                </Table.Body>
            </Table>
        </Box>
    );
}
