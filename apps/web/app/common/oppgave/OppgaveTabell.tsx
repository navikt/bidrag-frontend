import type { Beskrivelseinnslag, BidragOppgaveDto } from "@bidrag/api/BidragOppgaveApi";
import { MaskerSensitivInfo, PersonNavn } from "@bidrag/common";
import { formaterDato } from "@bidrag/utils/datoUtils";
import { BodyLong, Box, Detail, HStack, Label, Link, List, Table, VStack } from "@navikt/ds-react";
import { ListItem } from "@navikt/ds-react/List";
import { Link as RouterLink } from "react-router";
import { ObfuscateFnrLink } from "~/common/person/ObfuscateFnrLink.tsx";

interface OppgaveTabellProps {
    oppgaver: BidragOppgaveDto[];
}

function BeskrivelseListe({ innslag }: { innslag?: Beskrivelseinnslag[] | null }) {
    if (!innslag?.length) return <p>Ingen beskrivelser</p>;

    return (
        <VStack as="ol" gap="space-16" padding="space-16" className="list-none">
            {innslag.map((beskrivelse, indeks) => (
                <VStack as="li" gap="space-4" key={`${beskrivelse.tidspunkt ?? "uten-tidspunkt"}-${indeks}`}>
                    <HStack gap="space-8" align={"center"}>
                        <Label>
                            {beskrivelse.tidspunkt && (
                                <time dateTime={beskrivelse.tidspunkt}>{formaterDato(beskrivelse.tidspunkt)}</time>
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
        <Box>
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
                            content={
                                <MaskerSensitivInfo>
                                    <BeskrivelseListe innslag={oppgave.beskrivelseListe} />
                                </MaskerSensitivInfo>
                            }
                        >
                            <Table.DataCell scope="row">{oppgave.id}</Table.DataCell>
                            <Table.DataCell scope="row">{oppgave.oppgavetype}</Table.DataCell>
                            <Table.DataCell>{oppgave.tildeltEnhetsnr}</Table.DataCell>
                            <Table.DataCell>{formaterDato(oppgave.fristFerdigstillelse)}</Table.DataCell>
                            <Table.DataCell>{oppgave.tilordnetRessurs || "-"}</Table.DataCell>
                            <Table.DataCell>
                                {oppgave.saksreferanse ? (
                                    <Link as={RouterLink} to={`/sak/${encodeURIComponent(oppgave.saksreferanse)}`}>
                                        {oppgave.saksreferanse}
                                    </Link>
                                ) : (
                                    "-"
                                )}
                            </Table.DataCell>
                            <Table.DataCell>
                                {oppgave.brukerIdent ? (
                                    <Link as={ObfuscateFnrLink} to={`/bruker/${oppgave.brukerIdent}`}>
                                        <PersonNavn ident={oppgave.brukerIdent} />
                                    </Link>
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
