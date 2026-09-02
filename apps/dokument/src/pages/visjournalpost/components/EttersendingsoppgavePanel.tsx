import { EttersendingsppgaveDtoStatusEnum, JournalpostStatus } from "@bidrag/api/BidragDokumentApi";
import { dateToDDMMYYYYString } from "@bidrag/common";
import { BodyShort, Box, Button, Heading, HStack, Label, List, Modal, Table } from "@navikt/ds-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { BIDRAG_DOKUMENT_API } from "../../../api/api";
import { DokumentQueryKeys, useHentJournalpost } from "../../../hooks/useDokumentApi";

export default function EttersendingsoppgavePanel() {
    const journalpost = useHentJournalpost();
    const ettersendingsoppgave = journalpost.ettersendingsppgave;
    if (!ettersendingsoppgave) return null;
    const erOpprettet = ettersendingsoppgave.status !== EttersendingsppgaveDtoStatusEnum.IKKE_OPPRETTET;
    const kanOpprette =
        [JournalpostStatus.DISTRIBUERT, JournalpostStatus.EKSPEDERT].includes(journalpost.status) && !erOpprettet;

    return (
        <div>
            <Heading size="medium">Ettersendingsoppgave</Heading>
            <HStack gap="space-2">
                <Table
                    size="small"
                    className="w-fit [&_.navds-table\_\_data-cell]:border-none [&_.navds-table\_\_header-cell]:border-none [&_.navds-table\_\_data-cell]:!pl-0"
                >
                    <Table.Header>
                        <Table.HeaderCell scope="col" className={"w-[55px]"}></Table.HeaderCell>
                        <Table.HeaderCell scope="col"></Table.HeaderCell>
                    </Table.Header>
                    <Table.Body>
                        <Table.Row shadeOnHover={false}>
                            <Table.DataCell textSize="small">
                                <Label size="small" className="self-left">
                                    Tittel:
                                </Label>
                            </Table.DataCell>
                            <Table.DataCell textSize="small">
                                <BodyShort size="small" className="self-center">
                                    {ettersendingsoppgave.tittel}
                                </BodyShort>
                            </Table.DataCell>
                        </Table.Row>
                        {erOpprettet ? (
                            <Table.Row shadeOnHover={false}>
                                <Table.DataCell textSize="small">
                                    <Label size="small" className="self-left">
                                        Frist:
                                    </Label>
                                </Table.DataCell>
                                <Table.DataCell textSize="small">
                                    <BodyShort size="small" className="self-center">
                                        {dateToDDMMYYYYString(new Date(ettersendingsoppgave.fristDato))}
                                    </BodyShort>
                                </Table.DataCell>
                            </Table.Row>
                        ) : (
                            <Table.Row shadeOnHover={false}>
                                <Table.DataCell textSize="small">
                                    <Label size="small" className="self-left">
                                        Status:
                                    </Label>
                                </Table.DataCell>
                                <Table.DataCell textSize="small">
                                    <HStack gap="space-2">
                                        <BodyShort size="small" className="self-center">
                                            Ikke opprettet
                                        </BodyShort>
                                        {kanOpprette && <OpprettEttersendelseOppgaveButton />}
                                    </HStack>
                                </Table.DataCell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                <Box>
                    <Label as="p" size="small">
                        Vedleggsliste
                    </Label>
                    <Box marginBlock="space-12" asChild>
                        <List data-aksel-migrated-v8 size="small">
                            {ettersendingsoppgave.vedleggsliste.map((vedlegg) => {
                                return <List.Item>{vedlegg.tittel}</List.Item>;
                            })}
                        </List>
                    </Box>
                </Box>
            </HStack>
        </div>
    );
}

function OpprettEttersendelseOppgaveButton() {
    const [open, setOpen] = React.useState(false);
    const qc = useQueryClient();
    const journalpost = useHentJournalpost();
    const opprettEttersendingsoppgave = useMutation({
        mutationFn: async () => {
            return BIDRAG_DOKUMENT_API.journal
                .distribuerJournalpost(journalpost.journalpostId, { lokalUtskrift: false })
                .then(() => {
                    qc.refetchQueries({ queryKey: DokumentQueryKeys.hentJournalpost(journalpost.journalpostId) });
                });
        },
    });
    return (
        <>
            <Button
                disabled={!opprettEttersendingsoppgave.isIdle}
                loading={opprettEttersendingsoppgave.isPending}
                size="xsmall"
                variant="secondary-neutral"
                onClick={() => setOpen(true)}
            >
                Opprett
            </Button>
            <Modal
                size="small"
                aria-label="Opprett ettersendingsoppgave"
                open={open}
                onClose={() => setOpen(false)}
                closeOnBackdropClick
            >
                <Modal.Header closeButton>
                    <Heading size="small">Opprett ettersendingsoppgave</Heading>
                </Modal.Header>
                <Modal.Body>
                    <BodyShort>
                        Det har skjedd en feil ved distribusjon av forsendelsen og ettersendingsoppaven har ikke blitt
                        opprettet.
                    </BodyShort>
                    <BodyShort>Ønsker du å opprette ettersendingsoppgaven?</BodyShort>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        size="xsmall"
                        variant="primary"
                        onClick={() => {
                            opprettEttersendingsoppgave.mutate();
                            setOpen(false);
                        }}
                    >
                        Opprett
                    </Button>
                    <Button size="xsmall" variant="secondary" onClick={() => setOpen(false)}>
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
