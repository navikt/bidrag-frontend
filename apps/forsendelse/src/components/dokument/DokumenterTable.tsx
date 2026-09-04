import "./DokumenterTable.css";

import { OpenDocumentUtils } from "@bidrag/common";
import { BodyShort, Button, Modal, Switch, Table } from "@navikt/ds-react";
import { useState } from "react";

import { DokumentStatus } from "../../constants/DokumentStatus";
import { useErrorContext } from "../../context/ErrorProvider";
import DokumentStatusInfo from "../../docs/DokumentStatusInfo.mdx";
import DokumentTittelInfo from "../../docs/DokumentTittel.mdx";
import { useDokumenterForm } from "../../pages/forsendelse/context/DokumenterFormContext";
import InfoKnapp from "../InfoKnapp";
import DokumentRows from "./DokumentRows";
import LeggTilDokumentButton from "./LeggTilDokumentKnapp";
import LeggTilFraMalKnapp from "./LeggTilFraMalKnapp";
import LeggTilVedleggKnapp from "./LeggTilVedleggKnapp";
import SlettForsendelseModal from "./SlettForsendelseModal";
// interface DokumenterTableProps {
//     forsendelseId: string;
//     dokumenter: IDokument[];
// }

// export default function DokumenterTable({ dokumenter, forsendelseId }: DokumenterTableProps) {
//     const [isEditable, setIsEditable] = useState(false);
//
//     return (
//         <DokumenterProvider forsendelseId={forsendelseId} dokumenter={dokumenter}>
//             <DokumenterTableContent />
//         </DokumenterProvider>
//     );
// }

export default function DokumenterTable() {
    const { dokumenter, toggleDeleteMode, deleteMode } = useDokumenterForm();
    return (
        <div className={"w-max"}>
            <div className={"flex flex-row mt-[10px]  w-full flex-wrap max-w-[95vw] gap-[20px]"}>
                <LeggTilDokumentButton />
                <LeggTilFraMalKnapp />
                <LeggTilVedleggKnapp />
            </div>

            <div className={"flex flex-row mt-[10px] w-full flex-wrap max-w-[95vw]"}>
                <div>Antall dokumenter: {dokumenter.length}</div>
                <div style={{ marginLeft: "auto" }}>
                    <Switch
                        checked={deleteMode}
                        size="small"
                        onChange={() => {
                            toggleDeleteMode();
                        }}
                    >
                        Slett flere
                    </Switch>
                </div>
            </div>
            <div className={"dokument-table "} style={{ borderColor: "var(--ax-border-neutral-subtle)" }}>
                <div className="w-full max-w-[95vw] overflow-x-auto overflow-y-hidden	">
                    <Table size={"small"} style={{ tableLayout: "auto", display: "block", width: "1028px" }}>
                        <DokumenterTableHeader />
                        <DokumentRows />
                    </Table>
                </div>
                <DokumenterTableBottomButtons />
            </div>
        </div>
    );
}

function DokumenterTableHeader() {
    return (
        <Table.Header>
            <Table.Row>
                <Table.HeaderCell scope="col" style={{ width: "3px" }}></Table.HeaderCell>
                <Table.HeaderCell scope="col" style={{ width: "3px" }}>
                    Nr.
                </Table.HeaderCell>
                <Table.HeaderCell scope="col" style={{ width: "550px" }}>
                    <div className="flex flex-row gap-1 items-center">
                        Tittel{" "}
                        <InfoKnapp>
                            <DokumentTittelInfo />
                        </InfoKnapp>
                    </div>
                </Table.HeaderCell>
                <Table.HeaderCell scope="col" style={{ width: "100px" }}>
                    Dok. dato
                </Table.HeaderCell>
                <Table.HeaderCell scope="col" align={"left"} style={{ width: "200px" }}>
                    <div className="flex flex-row gap-1 items-center">
                        Status{" "}
                        <InfoKnapp>
                            <DokumentStatusInfo />
                        </InfoKnapp>
                    </div>
                </Table.HeaderCell>
                <Table.HeaderCell scope="col" style={{ width: "50px" }}></Table.HeaderCell>
            </Table.Row>
        </Table.Header>
    );
}

function DokumenterTableBottomButtons() {
    const { resetDocumentChanges, dokumenter, forsendelseId, deleteMode } = useDokumenterForm();
    const { errorSource, resetError } = useErrorContext();
    const isAllDocumentsFinished = dokumenter.every(
        (d) => d.status === DokumentStatus.FERDIGSTILT || d.status === DokumentStatus.KONTROLLERT,
    );
    const { addWarning } = useErrorContext();
    function resetErrorAndChanges() {
        resetDocumentChanges();
        resetError();
    }
    return (
        <span className={"flex flex-row mt-[10px] w-full"}>
            {errorSource === "dokumenter" && (
                <Button onClick={resetErrorAndChanges} variant={"tertiary"} size={"small"}>
                    Angre siste endringer
                </Button>
            )}
            <div className="ml-auto justify-end flex flex-row gap-[5px]">
                <Button
                    size="small"
                    variant="tertiary"
                    onClick={() => {
                        if (!isAllDocumentsFinished) {
                            addWarning("Alle dokumenter må kontrolleres/ferdigstilles før de kan åpnes samtidig");
                        } else {
                            OpenDocumentUtils.åpneDokument(`BIF-${forsendelseId}`, null, false);
                        }
                    }}
                >
                    Åpne alle
                </Button>
                {deleteMode && <BekreftSlettingButton />}
            </div>
        </span>
    );
}

function BekreftSlettingButton() {
    const { isSavingChanges, hasChanged, saveChanges, dokumenter, toggleDeleteMode } = useDokumenterForm();
    const isOneOrMoreDocumentsDeleted = dokumenter.some((d) => d.status === DokumentStatus.SLETTET);
    const [modalOpen, setModalOpen] = useState(false);
    const closeModal = () => {
        setModalOpen(false);
    };
    const openModal = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setModalOpen(true);
    };

    function deleteDocuments() {
        saveChanges();
        toggleDeleteMode();
    }
    const deletedDocuments = dokumenter.filter((d) => d.status === DokumentStatus.SLETTET);
    const slettAlleDokumenter = deletedDocuments.length === dokumenter.length;
    return (
        <>
            <Button
                loading={isSavingChanges}
                onClick={openModal}
                variant={"tertiary"}
                disabled={!(hasChanged && isOneOrMoreDocumentsDeleted)}
                size={"small"}
                className="ml-auto justify-end"
            >
                Bekreft sletting
            </Button>
            {modalOpen && !slettAlleDokumenter && (
                <Modal
                    open
                    header={{
                        heading: `Ønsker du å slette ${
                            deletedDocuments.length > 1 ? " valgte dokumenter" : "valgt dokument"
                        }?`,
                    }}
                    onClose={closeModal}
                    className={`min-w-[450px] max-w-[900px]`}
                >
                    <Modal.Body>
                        <BodyShort>
                            Du er i ferd med å slette følgende {deletedDocuments.length > 1 ? "dokumenter" : "dokument"}
                            :
                            <ul>
                                {deletedDocuments.map((d) => (
                                    <li>{d.tittel}</li>
                                ))}
                            </ul>
                            Det vil ikke være mulig å angre slettingen
                        </BodyShort>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button size="small" variant="danger" onClick={deleteDocuments}>
                            Slett
                        </Button>
                        <Button size="small" variant={"tertiary"} onClick={closeModal}>
                            Avbryt
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
            {modalOpen && slettAlleDokumenter && <SlettForsendelseModal closeModal={closeModal} />}
        </>
    );
}
