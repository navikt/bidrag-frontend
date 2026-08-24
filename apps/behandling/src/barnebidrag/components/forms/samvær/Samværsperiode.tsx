import { ObjectUtils } from "@bidrag/common";
import React from "react";
import { useFormContext } from "react-hook-form";
import { FormControlledMonthPicker } from "../../../../common/components/formFields/FormControlledMonthPicker";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { useFomTomDato } from "../../../../common/hooks/useFomTomDato";
import type { SamværBarnformvalues, SamværPeriodeFormvalues } from "../../../../common/types/samværFormValues";
import { DateToDDMMYYYYString, dateOrNull, isAfterDate } from "../../../../utils/date-utils";

export const Samværsperiode = ({
    editableRow,
    item,
    field,
    fieldName,
    label,
}: {
    editableRow: boolean;
    item: SamværPeriodeFormvalues;
    fieldName: `${string}.perioder.${number}`;
    field: "fom" | "tom";
    label: string;
}) => {
    const { erVirkningstidspunktNåværendeMånedEllerFramITid, lesemodus } = useBehandlingProvider();
    const { getValues, clearErrors, setError } = useFormContext<SamværBarnformvalues>();
    const fieldIsDatoTom = field === "tom";
    const [fom, tom] = useFomTomDato(fieldIsDatoTom, undefined, Number(fieldName.split(".")[0]));

    const validateFomOgTom = () => {
        const periode = getValues(fieldName);
        const fomOgTomInvalid = !ObjectUtils.isEmpty(periode.tom) && isAfterDate(periode?.fom, periode.tom);

        if (fomOgTomInvalid) {
            setError(`${fieldName}.fom`, {
                type: "notValid",
                message: text.error.tomDatoKanIkkeVæreFørFomDato,
            });
        } else {
            clearErrors(`${fieldName}.tom`);
        }
    };

    return editableRow && !erVirkningstidspunktNåværendeMånedEllerFramITid ? (
        <FormControlledMonthPicker
            name={`${fieldName}.${field}`}
            label={label}
            placeholder="DD.MM.ÅÅÅÅ"
            defaultValue={item[field]}
            customValidation={validateFomOgTom}
            fromDate={fom}
            toDate={tom}
            lastDayOfMonthPicker={fieldIsDatoTom}
            required={!fieldIsDatoTom}
            readonly={lesemodus}
            hideLabel
        />
    ) : (
        <div className="h-6 flex items-center">{item[field] && DateToDDMMYYYYString(dateOrNull(item[field]))}</div>
    );
};
