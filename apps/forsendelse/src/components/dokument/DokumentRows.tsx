import { DokumentArkivSystemDto } from "@bidrag/api/BidragForsendelseApi";
import { dateToDDMMYYYYString, OpenDocumentUtils, removeNonPrintableCharachters } from "@bidrag/common";
import type { DragEndEvent, DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { TrashIcon as Delete, DragVerticalIcon, EyeIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Checkbox, Modal, Table, Textarea } from "@navikt/ds-react";
import React, { type CSSProperties, useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { DokumentStatus } from "../../constants/DokumentStatus";
import {
    type FormIDokument,
    type IForsendelseFormProps,
    useDokumenterForm,
} from "../../pages/forsendelse/context/DokumenterFormContext";
import type { IDokument } from "../../types/Dokument";
import TableDraggableBody from "../table/TableDraggableBody";
import DokumentLinkedTag from "./DokumentLinkedTag";
import DokumentStatusTag from "./DokumentStatusTag";
import OpenDokumentButton from "./OpenDokumentButton";
import SlettForsendelseModal from "./SlettForsendelseModal";
export default function DokumentRows() {
    const { dokumenter, forsendelseId, swapDocuments } = useDokumenterForm();

    function onDocumentsChange(event: DragEndEvent) {
        const { active, over } = event;

        if (active?.id !== over?.id) {
            const oldIndex = dokumenter.findIndex((d) => getRowKey(d) === active?.id);
            const newIndex = dokumenter.findIndex((d) => getRowKey(d) === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                swapDocuments(oldIndex, newIndex);
            }
        }
    }

    function getRowKey(d: FormIDokument) {
        return d.dokumentreferanse + d.journalpostId;
    }

    return (
        <TableDraggableBody rowData={dokumenter} getRowKey={getRowKey} onChange={onDocumentsChange}>
            {(dokument, i, id, attributes, listeners, style, ref) => (
                <DokumentRow
                    dokument={dokument}
                    forsendelseId={forsendelseId}
                    index={i}
                    ref={ref}
                    id={id}
                    key={id + i}
                    listeners={listeners}
                    attributes={attributes}
                    style={style}
                />
            )}
        </TableDraggableBody>
    );
}

interface IDokumentRowProps {
    id: string;
    index: number;
    dokument: FormIDokument;
    forsendelseId: string;
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap;
    style: CSSProperties;
}
const DokumentRow = React.forwardRef<HTMLTableRowElement, IDokumentRowProps>(
    ({ dokument, forsendelseId, index: rowIndex, listeners, attributes, style }: IDokumentRowProps, ref) => {
        const { index: dokindex, status, journalpostId, dokumentreferanse, dokumentDato } = dokument;
        const {
            register,
            formState: { errors },
        } = useFormContext<IForsendelseFormProps>();

        useEffect(() => {
            const { ref: formRef } = register(`dokumenter.${index}`);
            formRef(ref);
        }, []);

        const getRowStyle = () => {
            let styles = { ...style } as CSSProperties;

            if (dokument.status === DokumentStatus.SLETTET) {
                styles = { ...style };
            } else if (dokument.lagret === false) {
                styles = { ...style, backgroundColor: "var(--ax-success-100)" };
            }

            return styles;
        };

        const erLenkeTilDokumentIAnnenForsendelse = dokument.arkivsystem === DokumentArkivSystemDto.FORSENDELSE;

        const forsendelseIdNumeric = erLenkeTilDokumentIAnnenForsendelse
            ? dokument.originalJournalpostId
            : forsendelseId?.replace("BIF-", "");
        const originalDokumentreferanse = erLenkeTilDokumentIAnnenForsendelse
            ? dokument.originalDokumentreferanse
            : dokument.dokumentreferanse;

        const index = dokindex === -1 ? rowIndex : dokindex;
        return (
            <Table.Row
                key={rowIndex + dokumentreferanse + journalpostId}
                ref={ref}
                style={getRowStyle()}
                className={`dokument-row ${errors.dokumenter?.[rowIndex]?.message ? "error" : ""}`}
            >
                <Table.DataCell style={{ width: "3px" }} className={"cursor-all-scroll"} {...listeners} {...attributes}>
                    <DragVerticalIcon />
                </Table.DataCell>
                <Table.DataCell style={{ width: "3px" }}>{index + 1}</Table.DataCell>
                <EditableDokumentTitleRow dokument={dokument} index={rowIndex} />
                <Table.DataCell style={{ width: "100px" }}>
                    {dateToDDMMYYYYString(dokumentDato ? new Date(dokumentDato) : new Date())}
                </Table.DataCell>
                <Table.DataCell style={{ width: "200px" }}>
                    <span className="flex flex-row gap-[5px]">
                        <DokumentStatusTag status={status} />
                        {erLenkeTilDokumentIAnnenForsendelse && <DokumentLinkedTag />}
                    </span>
                </Table.DataCell>
                <Table.DataCell style={{ width: "50px" }}>
                    <span className={"flex flex-row gap-1 justify-end"}>
                        {dokument.status === "KONTROLLERT" && (
                            <Button
                                size={"small"}
                                variant={"tertiary"}
                                icon={<EyeIcon />}
                                onClick={() =>
                                    OpenDocumentUtils.åpneDokument(
                                        `BIF-${forsendelseIdNumeric}`,
                                        originalDokumentreferanse,
                                    )
                                }
                            />
                        )}
                        <OpenDokumentButton
                            dokumentreferanse={originalDokumentreferanse}
                            journalpostId={`BIF-${forsendelseIdNumeric}`}
                            status={dokument.status}
                            erSkjema={dokument.erSkjema}
                        />
                        <DeleteDocumentButton dokument={dokument} />
                    </span>
                </Table.DataCell>
            </Table.Row>
        );
    },
);

function DeleteDocumentButton({ dokument }: { dokument: FormIDokument }) {
    const { deleteDocument, saveChanges, deleteMode, dokumenter } = useDokumenterForm();
    const [modalOpen, setModalOpen] = useState(false);
    const closeModal = () => {
        setModalOpen(false);
    };
    const openModal = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setModalOpen(true);
    };

    function deleteDocumentFromForsendelse() {
        deleteDocument(dokument);
        saveChanges();
    }

    if (deleteMode) {
        const isChecked = dokument.status === DokumentStatus.SLETTET;
        return (
            <Checkbox
                checked={isChecked}
                onChange={() => {
                    deleteDocument(dokument);
                }}
            >
                <div></div>
            </Checkbox>
        );
    }
    const hasOnlyOneDocument = dokumenter.length === 1;
    return (
        <>
            <Button size={"small"} variant={"tertiary"} icon={<Delete />} onClick={openModal} />
            {modalOpen && !hasOnlyOneDocument && (
                <Modal
                    header={{
                        heading: "Ønsker du å slette dokumentet?",
                    }}
                    onClose={closeModal}
                    open={true}
                    closeOnBackdropClick
                >
                    <Modal.Body>
                        <BodyShort>
                            Du er i ferd med å slette dokument med tittel
                            <ul>
                                <li>{dokument.tittel}</li>
                            </ul>
                            Det vil ikke være mulig å angre slettingen
                        </BodyShort>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button size="small" variant="danger" onClick={deleteDocumentFromForsendelse}>
                            Slett
                        </Button>
                        <Button size="small" variant={"tertiary"} onClick={closeModal}>
                            Avbryt
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
            {modalOpen && hasOnlyOneDocument && <SlettForsendelseModal closeModal={closeModal} />}
        </>
    );
}
interface IEditableDokumentTitleRowProps {
    dokument: IDokument;
    index: number;
}
function EditableDokumentTitleRow({ dokument, index }: IEditableDokumentTitleRowProps) {
    const [inEditMode, setInEditMode] = useState(false);
    const enableBlurEvent = useRef(false);
    const { updateTitle, setIsEditingTittel } = useDokumenterForm();

    const {
        register,
        setValue,
        formState: { errors },
    } = useFormContext<IForsendelseFormProps>();
    const value = useWatch({ name: `dokumenter.${index}.tittel` });

    function _updateTitle() {
        setInEditMode(false);
        setIsEditingTittel(false);
        updateTitle(removeNonPrintableCharachters(value), dokument.dokumentreferanse);
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.code === "Escape") {
            setInEditMode(false);
            setIsEditingTittel(false);
            setValue(`dokumenter.${index}.tittel`, dokument.tittel);
        }

        if (e.code === "Enter" && !e.shiftKey) {
            _updateTitle();
        }
    }
    return (
        <Table.DataCell
            scope="row"
            style={{ width: "550px", height: "100%" }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setTimeout(() => (enableBlurEvent.current = true), 500);
                setInEditMode(true);
                setIsEditingTittel(true);
            }}
            onBlur={_updateTitle}
            onKeyDown={onKeyDown}
        >
            {inEditMode ? (
                <Textarea
                    autoFocus
                    maxRows={2}
                    minRows={1}
                    label="Tittel"
                    defaultValue={dokument.tittel}
                    hideLabel
                    {...register(`dokumenter.${index}.tittel`, { required: "Tittel kan ikke være tom" })}
                    error={errors.dokumenter?.[index]?.tittel?.message}
                />
            ) : (
                value
            )}
        </Table.DataCell>
    );
}
