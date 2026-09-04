import dayjs from "dayjs";
import { useRef } from "react";

import DateField from "../../../common/components/fields/DateField";
import EditableTextField from "../../../common/components/fields/EditableTextField";
import useRegisterField from "../../../common/components/form/hooks/useRegisterField";
import { useHentJournalpost } from "../../../hooks/useDokumentApi";
import { useAppContext } from "../../../store/AppContext";
import { type UpdateJournalpostFormValues, useVisJournalpostContext } from "../context/VisJournalpostProvider";
import ReturInfo from "./ReturInfo";

export default function JournalpostDetaljer() {
    const { saksnummer } = useAppContext().appState;
    const journalpost = useHentJournalpost();
    const { isEditMode } = useVisJournalpostContext();
    const ref = useRef<HTMLDivElement>(null);

    const { error, onUpdate } = useRegisterField<UpdateJournalpostFormValues>(
        "dokumentDato",
        {
            required: "Dokumentdato kan ikke være tom",
            validate: (value) => {
                return dayjs(value).isAfter(dayjs()) ? "Dok.dato kan ikke være senere enn dagens dato" : true;
            },
        },
        () => ref.current,
        {
            enabled: isDokumentDatoEditable(),
            initialValue:
                journalpost.isJoarkJournalpost && journalpost.isInngående
                    ? journalpost.mottattDato
                    : journalpost.dokumentDato,
        },
    );
    function isDokumentDatoEditable() {
        if (!isEditMode || !journalpost.isTemaBidrag) return false;
        if (journalpost.isForsendelse && !journalpost.isNotat) return false;
        if (journalpost.isJoarkJournalpost && journalpost.isUtgaaende) return false;
        return true;
    }

    return (
        <div>
            <div
                id={"vis-journalpost-detaljer"}
                style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(3, 0.5fr)" }}
            >
                <EditableTextField
                    id={"journalstatus"}
                    label={"Journalstatus"}
                    value={journalpost.journalStatusDisplayValue}
                />
                <EditableTextField
                    id={"dokumenttype"}
                    label={"Dokumenttype"}
                    value={journalpost.dokumentTypeDisplayValue}
                />
                {saksnummer && <EditableTextField id={"saksnummer"} label={"Saksnummer"} value={saksnummer} />}
                <EditableTextField
                    id={"journaldato"}
                    label={"Journaldato"}
                    value={journalpost.journalfortDatoDisplayValue}
                />
                <EditableTextField id={"fagomrade"} label={"Fagområde"} value={journalpost.fagomrade} />
                <EditableTextField id={"journalfortAv"} label={"Journalført av"} value={journalpost.journalfortAv} />
                <EditableTextField id={"enhet"} label={"Enhet"} value={journalpost.journalforendeEnhet} />
                <DateField
                    id={"dokumentdato"}
                    label={"Dokumentdato"}
                    value={journalpost.mottattDatoDisplayValue}
                    onChange={onUpdate}
                    maxValidDate={dayjs().toISOString()}
                    editable={isDokumentDatoEditable()}
                    error={error?.message}
                    containerRef={ref}
                />
                {journalpost.ekspedertDatoDisplayValue && (
                    <EditableTextField
                        id={"ekspedertDato"}
                        label={"Sendt dato"}
                        value={journalpost.ekspedertDatoDisplayValue}
                    />
                )}
            </div>
            <ReturInfo />
        </div>
    );
}
