import { Heading } from "@navikt/ds-react";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef } from "react";
import type { Matcher } from "react-day-picker";
import { useFormContext } from "react-hook-form";

import DateField from "../../../common/components/fields/DateField";
import EditableTextField from "../../../common/components/fields/EditableTextField";
import useRegisterField from "../../../common/components/form/hooks/useRegisterField";
import { parseDateFromDDMMYYYY } from "../../../common/utils/DateUtils";
import { useHentJournalpost } from "../../../hooks/useDokumentApi";
import { JournalStatus, type ReturDetaljerLoggDto } from "../../../types/api/JournalpostTypes";
import type { Journalpost, ReturDetaljer, ReturDetaljerLogg } from "../../../types/journalpost";
import { type UpdateJournalpostFormValues, useVisJournalpostContext } from "../context/VisJournalpostProvider";

export default function ReturInfo() {
    const journalpost = useHentJournalpost();
    if (!journalpost.returDetaljer) {
        return null;
    }

    function sortByDate(a: ReturDetaljerLoggDto, b: ReturDetaljerLoggDto) {
        if (a.dato == null || b.dato == null) {
            return 2;
        }
        return b.dato.localeCompare(a.dato);
    }

    return (
        <div style={{ paddingTop: "15px" }}>
            <Heading size="medium">Retur</Heading>
            <ReturDetaljerSummary
                returDetaljer={journalpost.returDetaljer as any}
                erDistribuert={journalpost.journalstatus === JournalStatus.EKSPEDERT}
                harKommetIRetur={!journalpost.isJoarkJournalpost || journalpost.journalstatus === JournalStatus.RETUR}
            />
            {journalpost.returDetaljer.logg && journalpost.returDetaljer.logg.length > 0 && (
                <div className={"retur-detaljer-logg"} style={{ paddingTop: "24px" }}>
                    <Heading size="small" style={{ paddingBottom: "16px" }}>
                        Logg
                    </Heading>
                    {journalpost.returDetaljer.logg
                        .slice()
                        .sort(sortByDate)
                        .map((logg, index) => (
                            <ReturDetaljerLog logg={logg as any} index={index} journalpost={journalpost} />
                        ))}
                </div>
            )}
        </div>
    );
}

interface ReturDetaljerSummaryProps {
    returDetaljer: ReturDetaljer;
    harKommetIRetur: boolean;
    erDistribuert: boolean;
}
function ReturDetaljerSummary({ returDetaljer, harKommetIRetur, erDistribuert }: ReturDetaljerSummaryProps) {
    return (
        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
            <DateField
                id={"sistReturDato"}
                label={"Sist registrert dato"}
                style={{ width: "50%", minWidth: "200px" }}
                value={!harKommetIRetur && erDistribuert ? "Ny distribusjon bestilt" : (returDetaljer.dato ?? "Ukjent")}
            />
            <EditableTextField
                id={"antallRetur"}
                style={{ width: "100%" }}
                label={"Antall"}
                value={returDetaljer.antall?.toString(10)}
            />
        </div>
    );
}

interface ReturDetaljerLogProps {
    logg: ReturDetaljerLogg;
    index: number;
    journalpost: Journalpost;
}
function ReturDetaljerLog({ logg, index, journalpost }: ReturDetaljerLogProps) {
    const { isEditMode } = useVisJournalpostContext();
    const ref = useRef<HTMLDivElement>(null);
    const { setValue } = useFormContext<UpdateJournalpostFormValues>();
    const isEditable = useMemo(() => logg.locked != true, [journalpost, logg]);
    function getInvalidDates(): Matcher[] {
        return (
            journalpost.returDetaljer?.logg
                .filter((rLogg) => rLogg.dato != logg.dato)
                .map((rLogg) => ({
                    from: parseDateFromDDMMYYYY(rLogg.dato),
                    to: parseDateFromDDMMYYYY(rLogg.dato),
                })) ?? []
        );
    }
    const nyDatoField = useRegisterField<UpdateJournalpostFormValues>(
        `endreReturDetaljer.${index}.nyDato`,
        {},
        () => null,
        {
            enabled: isEditMode,
            initialValue: undefined,
        },
    );

    const beskrivelseField = useRegisterField<UpdateJournalpostFormValues>(
        `endreReturDetaljer.${index}.beskrivelse`,
        { required: "Retur detaljer beskrivelse kan ikke være tom" },
        () => ref.current.querySelector("textarea"),
        {
            enabled: isEditMode,
            initialValue: logg.beskrivelse,
        },
    );

    useEffect(() => {
        setValue(`endreReturDetaljer.${index}.originalDato`, logg.dato);
    }, [logg]);

    const today = dayjs().format("YYYY-MM-DD");
    return (
        <div
            className={`returDetaljerLogg.${index}`}
            ref={ref}
            style={{
                display: "flex",
                flexWrap: "nowrap",
                flexDirection: "row",
                width: "100%",
                paddingBottom: "16px",
            }}
        >
            <DateField
                id={`returDato.${index}`}
                label={"Retur dato"}
                style={{ width: "50%", minWidth: "200px" }}
                value={nyDatoField.value ?? logg.dato}
                onChange={nyDatoField.onUpdate}
                error={nyDatoField.error?.message}
                editable={isEditMode && isEditable}
                maxValidDate={today}
                minValidDate={journalpost.dokumentDato}
                invalidDateRanges={getInvalidDates()}
            />
            <EditableTextField
                id={`beskrivelse.${index}`}
                style={{ width: "100%" }}
                label={"Kommentar"}
                textArea
                maxLength={1000}
                editable={isEditMode && isEditable}
                value={beskrivelseField.value ?? logg.beskrivelse}
                error={beskrivelseField.error?.message}
                onChange={beskrivelseField.onUpdate}
            />
        </div>
    );
}
