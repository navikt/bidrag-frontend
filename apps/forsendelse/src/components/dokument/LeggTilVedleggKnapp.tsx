import type { DokumentMalDetaljer } from "@bidrag/api/BidragForsendelseApi";
import { PlusIcon as Add } from "@navikt/aksel-icons";
import { Button, Loader, Modal, Select } from "@navikt/ds-react";
import React, { useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

type DokumentMalDetaljerInnholdTypeEnum = NonNullable<DokumentMalDetaljer["innholdType"]>;

import { DokumentStatus } from "../../constants/DokumentStatus";
import { useVedleggListe } from "../../hooks/useForsendelseApi";
import { useDokumenterForm } from "../../pages/forsendelse/context/DokumenterFormContext";
import type { IDokument } from "../../types/Dokument";

export default function LeggTilVedleggKnapp() {
    const { addDocuments } = useDokumenterForm();
    const [modalOpen, setModalOpen] = useState(false);
    const { data: vedleggListe } = useVedleggListe();

    const closeModal = () => {
        setModalOpen(false);
    };
    if (vedleggListe.length === 0) {
        return null;
    }
    return (
        <div>
            <Button onClick={() => setModalOpen(true)} variant={"tertiary"} size={"small"} icon={<Add />}>
                Legg til vedlegg
            </Button>
            {modalOpen && (
                <LeggTilVedlegglModal
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

export interface DokumentFormProps {
    dokument: { malId: string; tittel: string; språk: string };
}
function LeggTilVedlegglModal({ onClose, open }: LeggTilDokumentFraSakModalProps) {
    const methods = useForm<DokumentFormProps>();

    function onSubmit(data: DokumentFormProps) {
        if (data.dokument) {
            onClose({
                dokumentmalId: data.dokument.malId,
                tittel: data.dokument.tittel,
                språk: data.dokument.språk,
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
                    heading: " Legg til vedlegg",
                }}
                className="max-w-max"
            >
                <form onSubmit={methods.handleSubmit(onSubmit)} className="mb-0">
                    <Modal.Body
                        style={{
                            minWidth: "max-content",
                        }}
                    >
                        <React.Suspense fallback={<Loader size={"medium"} />}>
                            <DokumentValgVedlegg />
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

interface SelectOptionData {
    malId: string;
    tittel: string;
    beskrivelse: string;
    språk: string;
    gruppeVisningsnavn?: string;
    innholdType: DokumentMalDetaljerInnholdTypeEnum;
}

function DokumentValgVedlegg() {
    const { data: vedleggListe } = useVedleggListe();
    const {
        register,
        setValue,
        formState: { errors },
        resetField,
    } = useFormContext<DokumentFormProps>();

    function hentSpråk(dokument: DokumentMalDetaljer): string {
        return dokument.språk.length > 0 ? dokument.språk[0] : "NB";
    }
    function getAllOptions(): Record<string, SelectOptionData[]> {
        const tableData = vedleggListe.map((vedlegg) => ({
            malId: vedlegg.malId,
            beskrivelse: vedlegg.detaljer.beskrivelse,
            tittel: vedlegg.detaljer.tittel,
            innholdType: vedlegg.detaljer.innholdType,
            gruppeVisningsnavn: vedlegg.detaljer.gruppeVisningsnavn,
            språk: hentSpråk(vedlegg.detaljer),
        }));

        const rowData: Record<string, SelectOptionData[]> = {};

        tableData.forEach((data) => {
            if (!rowData[data.gruppeVisningsnavn]) {
                rowData[data.gruppeVisningsnavn] = [];
            }

            rowData[data.gruppeVisningsnavn].push(data);
        });

        return rowData;
    }

    function onSelectionChange(malId: string) {
        const dokument = vedleggListe.find((d) => d.malId === malId);
        if (dokument) {
            const beskrivelse = dokument.detaljer.beskrivelse;
            const erNorsk = dokument.detaljer.språk.length === 0 || dokument.detaljer.språk.includes("NB");
            const tittel =
                erNorsk || beskrivelse === dokument.detaljer.tittel
                    ? dokument.detaljer.tittel
                    : `${dokument.detaljer.tittel} (${beskrivelse})`;
            setValue("dokument", {
                malId,
                tittel,
                språk: hentSpråk(dokument.detaljer),
            });
        } else {
            resetField("dokument");
        }
    }
    register("dokument", {
        validate: (dok) => {
            if (dok?.malId == null) return "Dokument må velges";
            if (dok?.tittel == null || dok.tittel.trim().length === 0) return "Tittel på dokumentet kan ikke være tom";
            return true;
        },
    });

    const options = getAllOptions();

    function mapToBeskrivelse(option: SelectOptionData) {
        if (option.språk === "NB") return option.beskrivelse;
        return `${option.beskrivelse} (${option.språk})`;
    }
    return (
        <div className="w-100">
            <Select
                label="Velg dokument"
                size="small"
                onChange={(ev) => onSelectionChange(ev.target.value)}
                error={errors.dokument?.message}
            >
                <option value="">Velg dokument</option>
                {Object.keys(options).map((gruppeVisningsnavn) => {
                    const dokumentListe = options[gruppeVisningsnavn];
                    return (
                        <optgroup label={gruppeVisningsnavn}>
                            {dokumentListe
                                .map((opt) => ({
                                    ...opt,
                                    beskrivelse: mapToBeskrivelse(opt),
                                }))
                                .sort((a, b) => (b.språk === "NB" ? 1 : a.beskrivelse.localeCompare(b.beskrivelse)))
                                .map((dokument) => (
                                    <option value={dokument.malId}>{dokument.beskrivelse}</option>
                                ))}
                        </optgroup>
                    );
                })}
            </Select>
        </div>
    );
}
