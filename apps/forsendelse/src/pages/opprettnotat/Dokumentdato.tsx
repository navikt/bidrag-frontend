import { dateToDDMMYYYYString } from "@bidrag/common";
import { DatePicker, useDatepicker } from "@navikt/ds-react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { toDateObject } from "../../utils/DateUtils";
import type { OpprettForsendelseFormProps } from "./OpprettNotatPage";

export default function Dokumentdato() {
    const {
        register,
        setValue,
        formState: { errors },
    } = useFormContext<OpprettForsendelseFormProps>();
    const { inputProps, datepickerProps } = useDatepicker({
        defaultSelected: new Date(),
        onDateChange: (val: Date) => {
            if (!val) return;
            setValue("dokumentdato", dateToDDMMYYYYString(val));
        },
    });

    useEffect(() => {
        register("dokumentdato", {
            validate: (value) =>
                toDateObject(value) > new Date() ? "Dokumentdato kan ikke være senere enn dagens dato" : true,
        });
    }, []);

    return (
        <DatePicker {...datepickerProps} disabled={[(date) => date > new Date()]}>
            <DatePicker.Input
                error={errors?.dokumentdato?.message}
                size="small"
                label="Dokumentdato"
                {...inputProps}
                name="dokumentdato"
            />
        </DatePicker>
    );
}
