import { type BostatusperiodeDto, type HusstandsmedlemDtoV2, TypeBehandling } from "@bidrag/api/BidragBehandlingApiV1";
import { ObjectUtils } from "@bidrag/common";
import { useFormContext } from "react-hook-form";
import { DateToDDMMYYYYString, dateOrNull, isAfterDate } from "../../../utils/date-utils";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { getEitherFirstDayOfFoedselsOrVirkingsdatoMonth } from "../../helpers/virkningstidspunktHelpers";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { useFomTomDato } from "../../hooks/useFomTomDato";
import { useVirkningsdato } from "../../hooks/useVirkningsdato";
import type { BoforholdFormValues } from "../../types/boforholdFormValues";
import { FormControlledMonthPicker } from "../formFields/FormControlledMonthPicker";

export const Periode = ({
    editableRow,
    item,
    field,
    fieldName,
    barn,
    label,
}: {
    editableRow: boolean;
    item: BostatusperiodeDto;
    fieldName: `husstandsmedlem.${number}.perioder.${number}`;
    field: "datoFom" | "datoTom";
    barn: HusstandsmedlemDtoV2;
    label: string;
}) => {
    const virkningsOrSoktFraDato = useVirkningsdato();
    const { type, boforhold } = useGetBehandlingV2();
    const boforholdBarn = boforhold.husstandsmedlem.find((h) => h.gjelderBarn?.id === barn.gjelderBarn?.id);
    const { erVirkningstidspunktNåværendeMånedEllerFramITid, lesemodus } = useBehandlingProvider();
    const { getValues, clearErrors, setError } = useFormContext<BoforholdFormValues>();
    const datoFra = getEitherFirstDayOfFoedselsOrVirkingsdatoMonth(
        barn.fødselsdato,
        dateOrNull(boforholdBarn?.beregnFra) ?? virkningsOrSoktFraDato,
    );
    const fieldIsDatoTom = field === "datoTom";
    const [fom, tom] = useFomTomDato(fieldIsDatoTom, datoFra, barn.gjelderBarn?.id);
    const isSærbidragTypeAndFieldIsDatoFom = type === TypeBehandling.SAeRBIDRAG && !fieldIsDatoTom;

    const validateFomOgTom = () => {
        const periode = getValues(fieldName);
        const fomOgTomInvalid = !ObjectUtils.isEmpty(periode.datoTom) && isAfterDate(periode?.datoFom, periode.datoTom);

        if (fomOgTomInvalid) {
            setError(`${fieldName}.datoFom`, {
                type: "notValid",
                message: text.error.tomDatoKanIkkeVæreFørFomDato,
            });
        } else {
            clearErrors(`${fieldName}.datoFom`);
        }
    };

    return !isSærbidragTypeAndFieldIsDatoFom && editableRow && !erVirkningstidspunktNåværendeMånedEllerFramITid ? (
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
