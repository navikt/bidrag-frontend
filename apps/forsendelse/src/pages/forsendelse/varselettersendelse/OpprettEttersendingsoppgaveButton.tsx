import { dateToDDMMYYYYString } from "@bidrag/common";
import {
    PlusCircleIcon as AddCircle,
    FloppydiskIcon,
    InformationSquareIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from "@navikt/aksel-icons";
import {
    BodyShort,
    Box,
    Button,
    ExpansionCard,
    Heading,
    HStack,
    Label,
    Loader,
    Modal,
    Page,
    Select,
    Table,
    TextField,
    UNSAFE_Combobox,
    VStack,
} from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { Suspense, useMemo, useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";

import {
    mapVarselEttersendelse,
    mapForsendelseResponse as varselForsendelseUpdater,
} from "../../../helpers/forsendelseHelpers";
import { useHentVedleggskoder } from "../../../hooks/kodeverkQueries";
import { useHentJournalInngående } from "../../../hooks/useDokumentApi";
import useFeatureToogle from "../../../hooks/useFeatureToggle";
import { UseForsendelseApiKeys, useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
import {
    useHentEksisterendeOppgaverForsendelse,
    useOppdaterVarselEttersendelse,
    useOpprettVarselEttersendelse,
    useSlettVarselEttersendelse,
    useSlettVarselEttersendelseDokument,
} from "../../../hooks/varselEnderselseApi";
import type { KodeBeskrivelse } from "../../../types/KodeverkTypes";
import type { IForsendelseFormProps, VarselEttersendelseVedleggProps } from "../context/DokumenterFormContext";
import { useSession } from "../context/SessionContext";
import { VarselDetaljer } from "./EttersendingsoppgaveDetaljer";
export const ettersendingsformPrefiks = "ettersendingsoppgave";
const navAnnenSkjema = "VANL";

export default function OpprettEttersendelseOppgaveButton() {
    const { isEttersendingsoppgaveEnabled } = useFeatureToogle();
    const [isOpen, setIsOpen] = useState(false);
    const forsendelse = useHentForsendelseQuery();

    if (!isEttersendingsoppgaveEnabled) return;
    if (forsendelse.gjelderIdent !== forsendelse.mottaker?.ident) return;
    return (
        <React.Suspense fallback={<Loader size="xsmall" />}>
            {forsendelse.ettersendingsoppgave ? (
                <EttersendelseOppgavePanel />
            ) : (
                <>
                    <Button variant="tertiary" size="small" icon={<PlusIcon />} onClick={() => setIsOpen(true)}>
                        Opprett ettersendingsoppgave
                    </Button>
                    <OpprettEttersendelseOppgaveModal isOpen={isOpen} setIsOpen={setIsOpen} />
                </>
            )}
        </React.Suspense>
    );
}

type FormProps = {
    journalpostId: string;
    tittel?: string;
};
function OpprettEttersendelseOppgaveModal({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}) {
    const { forsendelseId } = useSession();
    const qc = useQueryClient();
    const inngåendeJournalposter = useHentJournalInngående();
    const { setValue } = useFormContext<IForsendelseFormProps>();
    const form = useForm<FormProps>({
        defaultValues: {
            journalpostId: inngåendeJournalposter.length > 0 ? inngåendeJournalposter[0].journalpostId : navAnnenSkjema,
        },
    });
    const opprettVarselEttersendelseFn = useOpprettVarselEttersendelse();
    const journalpostId = useWatch({ control: form.control, name: "journalpostId" });

    function opprett(data: FormProps) {
        const journalpost = inngåendeJournalposter.find((jp) => jp.journalpostId === data.journalpostId);
        if (data.journalpostId === navAnnenSkjema && !data.tittel) {
            form.setError("tittel", { message: "Tittel må settes når det ikke knyttes til skjema" });
            return;
        }
        if (data.journalpostId === navAnnenSkjema && data.tittel && data.tittel.length > 250) {
            form.setError("tittel", { message: "Tittel kan ikke være lengre enn 250 tegn" });
            return;
        }

        opprettVarselEttersendelseFn
            .mutateAsync({
                forsendelseId: Number(forsendelseId.replace("BIF-", "")),
                tittel: data.journalpostId === navAnnenSkjema ? data.tittel : journalpost?.innhold,
                ettersendelseForJournalpostId: data.journalpostId,
                skjemaId: journalpost?.brevkode?.kode ?? data.journalpostId,
            })
            .then(async (opprettetVarselEttersendelse) => {
                setValue("ettersendingsoppgave", mapVarselEttersendelse(opprettetVarselEttersendelse.data));
                qc.setQueryData(
                    UseForsendelseApiKeys.hentForsendelse(forsendelseId),
                    varselForsendelseUpdater(opprettetVarselEttersendelse.data),
                );
                setIsOpen(false);
            });
    }
    return (
        <form onSubmit={form.handleSubmit(opprett)}>
            <Modal open={isOpen} closeOnBackdropClick onClose={() => setIsOpen(false)} className="w-full">
                <Modal.Header closeButton>
                    <Heading size="medium">Opprett ettersendingsoppgave</Heading>
                </Modal.Header>
                <Modal.Body>
                    <FormProvider {...form}>
                        <React.Suspense fallback={<Loader size="xsmall" />}>
                            <EksisterendeOppgaveVarsel />
                            <VarselForJournalpostSelect />
                            {journalpostId === navAnnenSkjema && (
                                <TextField
                                    className="w-[300px] pt-2"
                                    size="small"
                                    label="Tittel"
                                    {...form.register(`tittel`)}
                                    error={form.formState?.errors?.tittel?.message}
                                />
                            )}
                        </React.Suspense>
                    </FormProvider>
                </Modal.Body>
                <Modal.Footer>
                    <Button size="small">Opprett</Button>
                </Modal.Footer>
            </Modal>
        </form>
    );
}

function EttersendelseOppgavePanel() {
    useHentVedleggskoder();
    return (
        <Page.Block className="pb-4">
            <HStack gap="space-2" className="pb-4">
                <Heading className="self-center" size="medium">
                    Ettersendingsoppgave
                </Heading>
                <SlettOppgaveButton />
            </HStack>
            <EksisterendeOppgaveVarsel />
            <VStack gap="space-2" className="max-w-[95vw] w-[1000px]">
                <VarselDetaljer />
                <Box>
                    <Heading size="xsmall">Vedleggsliste</Heading>
                    <EttersendingsoppgaveVedleggsliste />
                </Box>
            </VStack>
        </Page.Block>
    );
}

function SlettOppgaveButton() {
    const [open, setOpen] = useState(false);
    const qc = useQueryClient();
    const forsendelse = useHentForsendelseQuery();
    const slettVarselEttersendelseFn = useSlettVarselEttersendelse();
    function slettVarsel() {
        slettVarselEttersendelseFn
            .mutateAsync({
                forsendelseId: Number(forsendelse.forsendelseId.replace("BIF-", "")),
            })
            .then(() => {
                qc.refetchQueries({ queryKey: UseForsendelseApiKeys.hentForsendelse(forsendelse.forsendelseId) });
            });
    }

    return (
        <>
            <Button
                variant="tertiary"
                type="button"
                size="xsmall"
                className="w-fit"
                icon={<TrashIcon />}
                onClick={() => setOpen(true)}
            >
                Slett
            </Button>
            <Modal open={open} onClose={() => setOpen(false)}>
                <Modal.Header closeButton>
                    <Heading size="medium">Slett oppgave</Heading>
                </Modal.Header>
                <Modal.Body>
                    <BodyShort>Er du sikker på at du vil slette oppgaven?</BodyShort>
                    <BodyShort>Ettersendingsoppgave vil ikke bli opprettet for søknaden</BodyShort>
                </Modal.Body>
                <Modal.Footer>
                    <Button size="xsmall" variant="danger" onClick={slettVarsel}>
                        Slett
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
function EttersendingsoppgaveVedleggsliste() {
    const forsendelse = useHentForsendelseQuery();
    const { control, getValues, setError, reset, setValue } = useFormContext<IForsendelseFormProps>();
    const vedleggsliste = useFieldArray({ control, name: `${ettersendingsformPrefiks}.vedleggsliste` });
    const [editableRow, setEditableRow] = useState<number>(undefined);

    const oppdaterEttersendingsoppgaveFn = useOppdaterVarselEttersendelse();
    const slettVarselEttersendelseDokumentFn = useSlettVarselEttersendelseDokument();
    function onSaveRow(index: number) {
        const vedlegg = getValues(`${ettersendingsformPrefiks}.vedleggsliste.${index}`);
        if (vedlegg.tittel.length === 0) {
            setError(`${ettersendingsformPrefiks}.vedleggsliste.${index}.tittel`, {
                message: "Tittel kan ikke være tom",
            });
            return;
        }
        if (vedlegg.tittel.length > 250) {
            setError(`${ettersendingsformPrefiks}.vedleggsliste.${index}.tittel`, {
                message: "Tittel kan ikke være lengre enn 250 tegn",
            });
            return;
        }
        oppdaterEttersendingsoppgaveFn
            .mutateAsync({
                forsendelseId: Number(forsendelse.forsendelseId.replace("BIF-", "")),
                oppdaterDokument: {
                    id: vedlegg.varselDokumentId,
                    tittel: vedlegg.tittel,
                    skjemaId: vedlegg.skjemaId,
                },
            })
            .then((response) => {
                setEditableRow(undefined);
                vedleggsliste.replace(
                    response.data.vedleggsliste.map((d) => ({
                        ...d,
                        varselDokumentId: d.id,
                        type: d.skjemaId ? "SKJEMA" : "FRITEKST",
                    })),
                );
                reset(undefined, { keepValues: true, keepDirty: false });
            });
    }
    function onDeleteRow(index: number) {
        setEditableRow(undefined);

        const dokument = getValues(`${ettersendingsformPrefiks}.vedleggsliste.${index}`);
        if (dokument.varselDokumentId === undefined) {
            vedleggsliste.remove(index);
            return;
        }
        slettVarselEttersendelseDokumentFn
            .mutateAsync({
                forsendelseId: Number(forsendelse.forsendelseId.replace("BIF-", "")),
                id: dokument.varselDokumentId,
            })
            .then(() => {
                vedleggsliste.remove(index);
            });
    }

    function addDokument() {
        vedleggsliste.append({ tittel: "" });
        setEditableRow(vedleggsliste.fields.length);
    }
    return (
        <Box>
            <HStack>
                <Button
                    variant="tertiary"
                    type="button"
                    size="xsmall"
                    className="w-fit mb-2 mt-2"
                    icon={<AddCircle />}
                    onClick={addDokument}
                >
                    Legg til vedlegg
                </Button>
            </HStack>
            {vedleggsliste.fields.length > 0 && (
                <Table size="small">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell textSize="small"></Table.HeaderCell>
                            {/* <Table.HeaderCell textSize="small" className="w-[150px]"></Table.HeaderCell> */}
                            <Table.HeaderCell textSize="small" className="w-[5px]"></Table.HeaderCell>
                            <Table.HeaderCell textSize="small" className="w-[5px]"></Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {vedleggsliste.fields.map((dokument, index) => (
                            <Table.Row shadeOnHover={false} key={`${dokument.id}_${index}`}>
                                <Table.DataCell textSize="small">
                                    {editableRow === index ? (
                                        <Suspense fallback={<Loader size="xsmall" />}>
                                            <NavSkjemaSelect2 index={index} />
                                        </Suspense>
                                    ) : (
                                        <span>{convertSkjemaBeskrivelse(dokument)}</span>
                                    )}
                                </Table.DataCell>
                                {/* <Table.DataCell textSize="small">{dokument.skjemaId ?? "Annen"}</Table.DataCell> */}
                                <Table.DataCell textSize="small">
                                    <EditOrSaveButton
                                        index={index}
                                        editableRow={editableRow === index}
                                        onSaveRow={onSaveRow}
                                        onEditRow={() => {
                                            if (editableRow === undefined) {
                                                setEditableRow(index);
                                                setValue(
                                                    `${ettersendingsformPrefiks}.vedleggsliste.${index}`,
                                                    dokument,
                                                    {
                                                        shouldDirty: true,
                                                    },
                                                );
                                            }
                                        }}
                                    />
                                </Table.DataCell>
                                <Table.DataCell textSize="small">
                                    <Button
                                        size="small"
                                        variant="tertiary"
                                        icon={<TrashIcon />}
                                        onClick={() => onDeleteRow(index)}
                                    />
                                </Table.DataCell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}
        </Box>
    );
}

export function VarselForJournalpostSelect({ hideLabel = false, prefiks }: { hideLabel?: boolean; prefiks?: string }) {
    const inngåendeJournalposter = useHentJournalInngående();
    const form = useFormContext<FormProps | IForsendelseFormProps>();

    return (
        <Select
            hideLabel={hideLabel}
            label="Velg søknad"
            size="small"
            {...form.register(`${prefiks ? `${ettersendingsformPrefiks}.journalpostId` : "journalpostId"}`)}
        >
            {inngåendeJournalposter
                .sort((a, b) => a.dokumentDato.localeCompare(b.dokumentDato))
                .map((journalpost) => {
                    return (
                        <option key={journalpost.journalpostId} value={journalpost.journalpostId}>
                            {journalpost.innhold} ({dateToDDMMYYYYString(new Date(journalpost.dokumentDato))})
                        </option>
                    );
                })}
            <option key={navAnnenSkjema} value={navAnnenSkjema}>
                Uten tilknytning til skjema
            </option>
        </Select>
    );
}

function EksisterendeOppgaveVarsel() {
    const eksisterendeOppgaverMap = useHentEksisterendeOppgaverForsendelse();
    const eksisterendeOppgaver = useMemo(() => {
        return Object.values(eksisterendeOppgaverMap).flat();
    }, [eksisterendeOppgaverMap]);

    if (eksisterendeOppgaver.length === 0) return null;

    return (
        <ExpansionCard size="small" className="subtle-card w-[500px] mb-2">
            <ExpansionCard.Header>
                <HStack wrap={false} gap="space-2" align="center">
                    <div>
                        <InformationSquareIcon aria-hidden />
                    </div>
                    <div>
                        <ExpansionCard.Title size="small">
                            Bruker har{" "}
                            {eksisterendeOppgaver.length > 1
                                ? "flere ettersendingsoppgaver"
                                : "en ettersendingsoppgave"}
                        </ExpansionCard.Title>
                        <ExpansionCard.Description>
                            Dette vil opprette ny ettersendingsoppgave for bruker
                        </ExpansionCard.Description>
                    </div>
                </HStack>
            </ExpansionCard.Header>
            <ExpansionCard.Content>
                {eksisterendeOppgaver.map((oppgave, index) => {
                    return (
                        <div
                            className={`${index !== eksisterendeOppgaver.length - 1 ? "border-0 border-b border-solid border-ax-border-neutral-subtle" : ""} pt-2`}
                        >
                            <Label as="p" size="small">
                                Tittel
                            </Label>
                            <BodyShort size="small" spacing>
                                {oppgave.tittel}
                            </BodyShort>
                            <Label as="p" size="small">
                                Vedleggsliste
                            </Label>
                            <dl className="flex gap-1 flex-col mt-0">
                                {oppgave.vedleggsListe.map((vedlegg) => {
                                    return (
                                        <dt className="border-0 border-b border-solid border-ax-border-neutral">
                                            {vedlegg.tittel}
                                        </dt>
                                    );
                                })}
                            </dl>
                        </div>
                    );
                })}

                <style>{`
        .subtle-card {
          --ac-expansioncard-bg: var(--ax-brand-blue-100);
          --ac-expansioncard-border-open-color: var(--ax-border-brand-blue);
          --ac-expansioncard-border-hover-color: var(--ax-border-brand-blue);
        }`}</style>
            </ExpansionCard.Content>
        </ExpansionCard>
    );
}

function NavSkjemaSelect2({ hideLabel = true, index }: { hideLabel?: boolean; index: number }) {
    const bidragSkjemaer = useHentVedleggskoder();
    const form = useFormContext<IForsendelseFormProps>();

    return (
        <UNSAFE_Combobox
            hideLabel={hideLabel}
            label="Velg skjema"
            allowNewValues
            size="small"
            error={form.formState.errors?.ettersendingsoppgave?.vedleggsliste?.[index]?.tittel?.message}
            defaultValue={convertSkjemaBeskrivelse(
                form.getValues(`${ettersendingsformPrefiks}.vedleggsliste.${index}`),
            )}
            onChange={() => {
                return null;
            }}
            options={bidragSkjemaer.map((skjema) => ({
                label: convertSkjemaBeskrivelse(skjema),
                value: skjema.kode,
            }))}
            onToggleSelected={(value) => {
                const skjema = bidragSkjemaer.find((skjema) => skjema.kode === value);
                form.setValue(`${ettersendingsformPrefiks}.vedleggsliste.${index}.skjemaId`, skjema?.kode ?? "N6");
                form.setValue(
                    `${ettersendingsformPrefiks}.vedleggsliste.${index}.tittel`,
                    skjema?.beskrivelse ?? value,
                );
            }}
        ></UNSAFE_Combobox>
    );
}
export const EditOrSaveButton = ({
    index,
    editableRow,
    onSaveRow,
    onEditRow,
}: {
    index: number;
    editableRow: boolean;
    onSaveRow: (index: number) => void;
    onEditRow: (index: number) => void;
}) => {
    return editableRow ? (
        <Button
            type="button"
            onClick={() => onSaveRow(index)}
            icon={<FloppydiskIcon aria-hidden />}
            variant="tertiary"
            size="xsmall"
        ></Button>
    ) : (
        <Button
            type="button"
            onClick={() => onEditRow(index)}
            icon={<PencilIcon aria-hidden />}
            variant="tertiary"
            size="xsmall"
        ></Button>
    );
};
function convertSkjemaBeskrivelse(skjema: KodeBeskrivelse | VarselEttersendelseVedleggProps) {
    if ("skjemaId" in skjema) {
        if (skjema.skjemaId === "W3" || skjema.skjemaId === "N6_BL") {
            return `${skjema.tittel} (lenke til dokumentet)`;
        }
        if (skjema.skjemaId.startsWith("N6_FYLLUT")) {
            return `${skjema.tittel} (lenke til skjema)`;
        }
        return skjema.tittel;
    } else if ("kode" in skjema) {
        if (skjema.kode === "W3" || skjema.kode === "N6_BL") {
            return `${skjema.beskrivelse} (lenke til dokumentet)`;
        }
        if (skjema.kode.startsWith("N6_FYLLUT")) {
            return `${skjema.beskrivelse} (lenke til skjema)`;
        }
        return skjema.beskrivelse;
    }

    return skjema.tittel ?? skjema.beskrivelse;
}
