import { DokumentArkivSystemDto, type JournalTema } from "@bidrag/api/BidragForsendelseApi";
import { BodyShort, Button, Checkbox, Heading, Loader, Modal, Table } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router";
import { useBidragForsendelseApi } from "../../../api/api";
import GjelderSelect from "../../../components/detaljer/GjelderSelect";
import LanguageSelect from "../../../components/detaljer/LanguageSelect";
import DokumentStatusTag from "../../../components/dokument/DokumentStatusTag";
import type { DokumentStatus } from "../../../constants/DokumentStatus";
import { useHentForsendelseQuery, useHentRoller } from "../../../hooks/useForsendelseApi";
import type { IDokument } from "../../../types/Dokument";
import MottakerSelect from "../../opprettforsendelse/MottakerSelect";
import { useDokumenterForm } from "../context/DokumenterFormContext";
import { useSession } from "../context/SessionContext";

const OPPRETT_FORSENDELSE_MUTATION_KEY = "opprettForsendelse";

export default function KopierForsendelseButton() {
    const { addDocuments } = useDokumenterForm();
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div>
            <Button onClick={() => setModalOpen(true)} variant={"tertiary"} size={"small"}>
                Kopier forsendelse
            </Button>
            <KopierForsendelseModal
                open={modalOpen}
                onClose={(selectedDocuments) => {
                    if (selectedDocuments) {
                        addDocuments([selectedDocuments]);
                    }
                    setModalOpen(false);
                }}
            />
        </div>
    );
}

interface KopierForsendelseModalProps {
    onClose: (selectedDocument?: IDokument) => void;
    open: boolean;
}

interface DokumentRowData {
    dokumentreferanse: string;
    forsendelseId: string;
    tittel: string;
    status: DokumentStatus;
    selected: boolean;
}

interface KopierForsendelseFormProps {
    språk: string;
    gjelderIdent: string;
    mottakerIdent: string;
    dokumenter: DokumentRowData[];
}
function KopierForsendelseModal({ onClose, open }: KopierForsendelseModalProps) {
    const forsendelse = useHentForsendelseQuery();
    const bidragForsendelseApi = useBidragForsendelseApi();
    const roller = useHentRoller();
    const navigate = useNavigate();
    const { navigateToForsendelse } = useSession();
    const methods = useForm<KopierForsendelseFormProps>({
        defaultValues: {
            gjelderIdent: forsendelse.gjelderIdent,
            mottakerIdent: forsendelse.mottaker?.ident,
            språk: "NB",
            dokumenter: forsendelse.dokumenter.map((dokument) => ({
                dokumentreferanse: dokument.dokumentreferanse,
                forsendelseId: forsendelse.forsendelseId,
                tittel: dokument.tittel,
                status: dokument.status,
                selected: true,
            })),
        },
    });

    const opprettForsendelseFn = useMutation({
        mutationKey: [OPPRETT_FORSENDELSE_MUTATION_KEY],
        mutationFn: (data: KopierForsendelseFormProps) =>
            bidragForsendelseApi.api.opprettForsendelse({
                gjelderIdent: data.gjelderIdent,
                mottaker: {
                    ident: data.mottakerIdent,
                },
                saksnummer: forsendelse.saksnummer,
                behandlingInfo: {
                    ...forsendelse.behandlingInfo,
                    barnIBehandling: [],
                },
                opprettTittel: true,
                distribuerAutomatiskEtterFerdigstilling: false,
                enhet: forsendelse.enhet,
                tema: forsendelse.tema as JournalTema,
                språk: data.språk,
                dokumenter: [
                    {
                        tittel: "Forside",
                        dokumentmalId: "BI01S02",
                        bestillDokument: false,
                        ferdigstill: false,
                    },
                    ...data.dokumenter
                        .filter((d) => d.selected)
                        .map((d) => ({
                            tittel: d.tittel,
                            dokumentreferanse: d.dokumentreferanse,
                            journalpostId: forsendelse.forsendelseId,
                            arkivsystem: DokumentArkivSystemDto.BIDRAG,
                            bestillDokument: false,
                            ferdigstill: false,
                        })),
                ],
            }),
        onSuccess: (data) => {
            const forsendelseId = data.data.forsendelseId;
            onClose();
            navigateToForsendelse(forsendelseId?.toString(), data.data.forsendelseType);
            navigate(0);
        },
    });

    function onSubmit(data: KopierForsendelseFormProps) {
        opprettForsendelseFn.mutate(data);
    }

    return (
        <FormProvider {...methods}>
            <Modal open={open} onClose={() => onClose()} header={{ heading: "Kopier forsendelse" }}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <Modal.Body
                        style={{
                            minWidth: "max-content",
                            minHeight: "max-content",
                            padding: "2rem 2rem",
                            overflowY: "auto",
                        }}
                    >
                        <BodyShort>
                            Opprett ny forsendelse med valgte dokumenter
                            <br />
                            Det vil bli opprettet en "Fritekstbrev" som forside i forsendelsen
                        </BodyShort>
                        <React.Suspense fallback={<Loader size={"medium"} />}>
                            <GjelderSelect roller={roller} />
                            <MottakerSelect />
                            <div className="w-max">
                                <LanguageSelect />
                            </div>
                            <Heading size="small">Kopier dokumenter</Heading>
                            <DokumentValgTable />
                        </React.Suspense>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button size="small" type="submit" loading={opprettForsendelseFn.isPending}>
                            Opprett
                        </Button>
                        <Button size="small" variant={"tertiary"} onClick={() => onClose()}>
                            Avbryt
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </FormProvider>
    );
}

function DokumentValgTable() {
    const { control } = useFormContext<KopierForsendelseFormProps>();
    const { fields, update } = useFieldArray<KopierForsendelseFormProps>({ control, name: "dokumenter" });
    const allSelected = fields.every((d) => d.selected);
    const someSelected = fields.some((d) => d.selected);
    return (
        <Table size="small">
            <Table.Header>
                <Table.Row>
                    <Table.DataCell>
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            size="small"
                            hideLabel
                            onChange={() => {
                                fields.forEach((d, index) => {
                                    update(index, { ...d, selected: !allSelected });
                                });
                            }}
                        >
                            Velg alle rader
                        </Checkbox>
                    </Table.DataCell>
                    <Table.HeaderCell>Tittel</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <DokumentValgTableRows rows={fields} update={update} />
        </Table>
    );
}

interface DokumentValgTableProps {
    rows: DokumentRowData[];
    update: (index: number, data: DokumentRowData) => void;
}
function DokumentValgTableRows({ rows, update }: DokumentValgTableProps) {
    return (
        <Table.Body>
            {rows.map((row, index) => (
                <Table.Row key={row.dokumentreferanse}>
                    <Table.DataCell width={"1%"}>
                        <Checkbox
                            size="small"
                            value={row.dokumentreferanse}
                            checked={row.selected}
                            onChange={() => {
                                update(index, {
                                    ...row,
                                    selected: !row.selected,
                                });
                            }}
                        >
                            {""}
                        </Checkbox>
                    </Table.DataCell>
                    <Table.DataCell width="60%">{row.tittel}</Table.DataCell>
                    <Table.DataCell width="40%">
                        <DokumentStatusTag status={row.status} />
                    </Table.DataCell>
                </Table.Row>
            ))}
        </Table.Body>
    );
}
