import { Label } from "@navikt/ds-react";
import dayjs from "dayjs";
import React, { useRef } from "react";

import CustomDatepicker from "../../../../common/components/form/CustomDatepicker";
import useRegisterField from "../../../../common/components/form/hooks/useRegisterField";
import { isFutureDate, isValidDate } from "../../../../common/utils/DateUtils";
import { useHentJournalpost } from "../../../../servicesV2/useDokumentApi";
import { JournalpostToRegister } from "../types/JournalpostToRegister";

export default function MottatDato() {
    const journalpost = useHentJournalpost();
    const ref = useRef<HTMLInputElement>(null);
    const initialValue = journalpost.isJoarkJournalpost ? journalpost.mottattDato : journalpost.journalfortDato;
    const { error, onUpdate, value } = useRegisterField<JournalpostToRegister>(
        "mottatDato",
        { required: "Motatt dato er påkrevd", validate: validateDate },
        () => ref.current,
        {
            validateOnUpdate: true,
            initialValue: initialValue,
        }
    );

    function validateDate(date: string) {
        if (date.length === 0) {
            return true;
        }

        if (!isValidDate(date)) {
            return "Ugyldig format på dato";
        } else if (isFutureDate(date)) {
            return "Mottat dato kan ikke være senere enn dagens dato";
        }

        return true;
    }

    function getMaxValidDate() {
        return dayjs(new Date()).format("YYYY-MM-DD");
    }

    return (
        <div id={"mottatDato"}>
            <Label htmlFor={"datepicker_mottattDato"} size="small" spacing>
                {"Mottattdato"}
            </Label>
            <CustomDatepicker
                name={"datepicker_mottattDato"}
                inputRef={(inputRef) => (ref.current = inputRef)}
                value={value}
                initialValue={initialValue}
                onChange={onUpdate}
                maxValidDate={getMaxValidDate()}
                error={error?.message}
            />
        </div>
    );
}
