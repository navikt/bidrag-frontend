import "./LeggTilDokumentButton.css";

import { PlusIcon as Add } from "@navikt/aksel-icons";
import { Button, Loader, Modal } from "@navikt/ds-react";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { DokumentStatus } from "../../constants/DokumentStatus";
import { useDokumenterForm } from "../../pages/forsendelse/context/DokumenterFormContext";
import type { IDokument } from "../../types/Dokument";
import DokumentValgForsendelse from "./DokumentValgForsendelse";

export default function LeggTilFraMalKnapp() {
    const { addDocuments } = useDokumenterForm();
    const [modalOpen, setModalOpen] = useState(false);

    const closeModal = () => {
        setModalOpen(false);
    };
    return (
        <div>
            <Button onClick={() => setModalOpen(true)} variant={"tertiary"} size={"small"} icon={<Add />}>
                Legg til fra mal
            </Button>
            {modalOpen && (
                <LeggTilDokumentFraMalModal
                    open={modalOpen}
                    onClose={(selectedDocuments) => {
                        if (selectedDocuments) {
                            addDocuments([selectedDocuments]);
                        }
                        closeModal();
                    }}
                />
            )}
        </div>
    );
}

interface LeggTilDokumentFraSakModalProps {
    onClose: (selectedDocument?: IDokument) => void;
    open: boolean;
}

interface OpprettDokumentFraMalFormProps {
    dokument: {
        malId: string;
        tittel: string;
        type: "UTGÅENDE" | "NOTAT";
    };
}
function LeggTilDokumentFraMalModal({ onClose, open }: LeggTilDokumentFraSakModalProps) {
    const methods = useForm<OpprettDokumentFraMalFormProps>();

    function onSubmit(data: OpprettDokumentFraMalFormProps) {
        if (data.dokument) {
            onClose({
                dokumentmalId: data.dokument.malId,
                tittel: data.dokument.tittel,
                status: DokumentStatus.IKKE_BESTILT,
                index: -1,
                lagret: false,
                metadata: null,
            });
        }
    }

    return (
        <FormProvider {...methods}>
            <Modal
                open={open}
                onClose={() => onClose()}
                header={{
                    heading: "Legg til dokument fra mal",
                }}
            >
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <Modal.Body
                        style={{
                            minWidth: "30rem",
                            minHeight: "max-content",
                            padding: "0.5rem 2rem 1rem 2rem",
                            overflowY: "auto",
                        }}
                    >
                        <React.Suspense fallback={<Loader size={"medium"} />}>
                            <DokumentValgForsendelse showLegend={false} />
                        </React.Suspense>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button size="small" type="submit">
                            Legg til
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
