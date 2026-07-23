import {MagnifyingGlassIcon, PencilIcon, TrashIcon} from "@navikt/aksel-icons";
import {BodyLong, Button, Heading, Modal, Pagination, Switch, Table, Tag, VStack} from "@navikt/ds-react";
import {useQueryClient} from "@tanstack/react-query";
import React, {useRef, useState} from "react";
import {Link as ReactRouterLink} from "react-router";
import {ConfirmationModal} from "./components/ConfirmationModal.tsx";
import {EndringsLoggDto, Endringstype} from "~/api/types/admin.ts";
import {useAktiverEndringslogg, useDeaktiverEndringslogg, useHentEndringslogger, useSlettEndringslogg} from "~/api/useApi.ts";


export enum EndringsloggTilhorerSkjermbilde {
    BEHANDLING_BIDRAG = "BEHANDLING_BIDRAG",
    BEHANDLING_FORSKUDD = "BEHANDLING_FORSKUDD",
    BEHANDLINGSAeRBIDRAG = "BEHANDLING_SÆRBIDRAG",
    BEHANDLING_ALLE = "BEHANDLING_ALLE",
    FORSENDELSE = "FORSENDELSE",
    INNSYN_DOKUMENT = "INNSYN_DOKUMENT",
    SAMHANDLER = "SAMHANDLER",
    ALLE = "ALLE",
}

export const EndringsloggTilhorerSkjermbildeToVisningsnavn = {
    [EndringsloggTilhorerSkjermbilde.ALLE]: "Alle (vises i alle skjermbilder)",
    [EndringsloggTilhorerSkjermbilde.BEHANDLING_ALLE]: "Behandling (alle)",
    [EndringsloggTilhorerSkjermbilde.BEHANDLING_BIDRAG]: "Bidrag",
    [EndringsloggTilhorerSkjermbilde.BEHANDLING_FORSKUDD]: "Forskudd",
    [EndringsloggTilhorerSkjermbilde.BEHANDLINGSAeRBIDRAG]: "Særbidrag",
    [EndringsloggTilhorerSkjermbilde.FORSENDELSE]: "Forsendelse",
    [EndringsloggTilhorerSkjermbilde.INNSYN_DOKUMENT]: "Innsyn dokument",
    [EndringsloggTilhorerSkjermbilde.SAMHANDLER]: "Samhandler",
};

const format = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${d}.${m}.${y}`;
};

export const EndringstypeToTagMapper = {
    [Endringstype.ENDRING]: {
        tag: "neutral" as const,
        tekst: "Endring",
    },
    [Endringstype.NYHET]: {
        tag: "info" as const,
        tekst: "Nyhet",
    },
    [Endringstype.FEILFIKS]: {
        tag: "success" as const,
        tekst: "Feilfiks",
    },
};

export const EndringsModal = ({
                                  open,
                                  onClose,
                                  selectedEndringslogg,
                                  closeOnBackdropClick,
                              }: {
    open: boolean;
    onClose: () => void;
    selectedEndringslogg: EndringsLoggDto;
    closeOnBackdropClick?: boolean;
}) => {
    const [pageState, setPageState] = useState(1);

    return (
        <Modal
            open={open}
            onClose={() => onClose()}
            header={{heading: selectedEndringslogg.tittel}}
            closeOnBackdropClick={closeOnBackdropClick}
            className="max-w-[1500px]"
        >
            <>
                <Modal.Body className="grid gap-4">
                    <Heading size="xsmall" className="flex gap-2">
                        {selectedEndringslogg.endringer[pageState - 1].tittel}
                        <Tag
                            variant={
                                EndringstypeToTagMapper[selectedEndringslogg.endringer[pageState - 1].endringstype].tag
                            }
                            size="xsmall"
                        >
                            {EndringstypeToTagMapper[selectedEndringslogg.endringer[pageState - 1].endringstype].tekst}
                        </Tag>
                    </Heading>

                    <BodyLong as="div" size="small">
                        <div
                            style={{
                                overflowWrap: "break-word",
                                maxWidth: "70rem",
                                minWidth: "38rem",
                                maxHeight: "40rem",
                            }}
                            dangerouslySetInnerHTML={{__html: selectedEndringslogg.endringer[pageState - 1].innhold}}
                        />
                    </BodyLong>
                </Modal.Body>
                <Modal.Footer style={{height: "4rem", justifyContent: "center"}}>
                    {selectedEndringslogg.endringer.length > 1 && (
                        <Pagination
                            page={pageState}
                            onPageChange={(page: number) => setPageState(page)}
                            count={selectedEndringslogg.endringer.length}
                            boundaryCount={1}
                            siblingCount={1}
                            size="xsmall"
                        />
                    )}
                </Modal.Footer>
            </>
        </Modal>
    );
};

const DeleteButton = ({endringsloggId}: { endringsloggId: number }) => {
    const ref = useRef<HTMLDialogElement>(null);
    const queryClient = useQueryClient();
    const slettEndringslogg = useSlettEndringslogg();
    const onSuccess = () => {
        queryClient.setQueryData<EndringsLoggDto[]>(["endringslogger"], (currentData: EndringsLoggDto[]) =>
            currentData?.filter((endring) => endring.id !== endringsloggId)
        );
        queryClient.removeQueries({queryKey: ["endringslogg", endringsloggId]});
    };

    const onDelete = () => {
        slettEndringslogg.mutate(endringsloggId, {onSuccess});
    };

    const onConfirm = () => {
        ref.current?.close();
        onDelete();
    };

    return (
        <>
            <Button
                variant="tertiary"
                size="small"
                icon={<TrashIcon title="Slett"/>}
                onClick={() => ref.current?.showModal()}
            />
            <ConfirmationModal
                ref={ref}
                description="Ønsker du å slette endringslogg?"
                heading={<Heading size="small">Ønsker du å slette?</Heading>}
                footer={
                    <>
                        <Button type="button" onClick={onConfirm} size="small">
                            Ja, slett
                        </Button>
                        <Button type="button" variant="secondary" size="small" onClick={() => ref.current?.close()}>
                            Avbryt
                        </Button>
                    </>
                }
            />
        </>
    );
};

const AktiverSwitch = ({endringsloggId, aktiv}: { endringsloggId: number; aktiv: boolean }) => {
    const queryClient = useQueryClient();
    const aktiver = useAktiverEndringslogg();
    const deaktiver = useDeaktiverEndringslogg();

    const onSuccess = (response) => {
        queryClient.setQueryData<EndringsLoggDto[]>(["endringslogger"], (currentData: EndringsLoggDto[]) => {
            return currentData?.map((endring) => {
                if (endring.id === response.id) {
                    return response;
                }
                return endring;
            });
        });
        queryClient.setQueryData<EndringsLoggDto>(["endringslogg", endringsloggId], () => response);
    };

    const onAktiverDeaktiver = (checked: boolean) => {
        if (checked) {
            aktiver.mutate(endringsloggId, {onSuccess});
        } else {
            deaktiver.mutate(endringsloggId, {onSuccess});
        }
    };

    return (
        <Switch
            checked={aktiv}
            onChange={(e) => onAktiverDeaktiver(e.target.checked)}
            size="small"
            hideLabel
            loading={aktiver.isPending || deaktiver.isPending}
        >
            Aktiver
        </Switch>
    );
};

export default function EndringsloggIndexPage() {
    const endringslogger = useHentEndringslogger();
    const [previewed, setPreviewed] = useState<EndringsLoggDto | null>(null);
    return (
        <>
            <VStack gap="space-4">
                <Button
                    variant="secondary"
                    size="small"
                    as={ReactRouterLink}
                    to="/admin/endringslogg/ny"
                    className="w-max"
                >
                    + Lag ny
                </Button>
                <Table zebraStripes size="small">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell scope="col">Tittel</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Gjelder</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Dato</Table.HeaderCell>
                            <Table.HeaderCell scope="col">Endringstyper</Table.HeaderCell>
                            <Table.HeaderCell scope="col" className="w-[72px]" align="center">
                                Aktiver
                            </Table.HeaderCell>
                            <Table.HeaderCell scope="col" className="w-[48px]" align="center"></Table.HeaderCell>
                            <Table.HeaderCell scope="col" className="w-[48px]" align="center"></Table.HeaderCell>
                            <Table.HeaderCell scope="col" className="w-[48px]" align="center"></Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {endringslogger.data
                            .sort((a, b) => (a.opprettetTidspunkt.localeCompare(b.opprettetTidspunkt) > 0 ? -1 : 1))
                            .filter((endringslogg) => endringslogg !== null)
                            .map((endringslogg, i) => {
                                return (
                                    <Table.Row key={i + endringslogg.tittel + endringslogg.dato}>
                                        <Table.HeaderCell scope="row">{endringslogg.tittel}</Table.HeaderCell>
                                        <Table.DataCell>
                                            {EndringsloggTilhorerSkjermbildeToVisningsnavn[endringslogg.gjelder]}
                                        </Table.DataCell>
                                        <Table.DataCell>{format(new Date(endringslogg.dato))}</Table.DataCell>
                                        <Table.DataCell>
                                            {endringslogg.endringstyper.map((endringstype, i) => (
                                                <Tag
                                                    key={i + endringstype}
                                                    variant={EndringstypeToTagMapper[endringstype].tag}
                                                    size="xsmall"
                                                    className="mr-2"
                                                >
                                                    {EndringstypeToTagMapper[endringstype].tekst}
                                                </Tag>
                                            ))}
                                        </Table.DataCell>
                                        <Table.DataCell>
                                            <AktiverSwitch
                                                endringsloggId={endringslogg.id}
                                                aktiv={endringslogg.aktiv}
                                            />
                                        </Table.DataCell>
                                        <Table.DataCell>
                                            {endringslogg.endringer.length > 0 && (
                                                <Button
                                                    variant="tertiary"
                                                    size="small"
                                                    icon={<MagnifyingGlassIcon title="Forhåndsvisning"/>}
                                                    onClick={() => setPreviewed(endringslogg)}
                                                />
                                            )}
                                        </Table.DataCell>
                                        <Table.DataCell>
                                            <Button
                                                variant="tertiary"
                                                size="small"
                                                as={ReactRouterLink}
                                                to={`/admin/endringslogg/${endringslogg.id}`}
                                                icon={<PencilIcon title="Rediger"/>}
                                            />
                                        </Table.DataCell>
                                        <Table.DataCell>
                                            <DeleteButton endringsloggId={endringslogg.id}/>
                                        </Table.DataCell>
                                    </Table.Row>
                                );
                            })}
                    </Table.Body>
                </Table>
            </VStack>
            {previewed && (
                <EndringsModal
                    open={!!previewed}
                    onClose={() => setPreviewed(null)}
                    selectedEndringslogg={previewed}
                    closeOnBackdropClick
                />
            )}
        </>
    );
};

