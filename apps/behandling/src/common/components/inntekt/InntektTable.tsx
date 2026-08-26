import {
    type InntektBarn,
    type InntektDtoV2,
    type InntektValideringsfeil,
    Kilde,
    type OppdatereInntektResponse,
    TypeBehandling,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ObjectUtils, toISODateString } from "@bidrag/common";
import { Buildings2Icon, FloppydiskIcon, PencilIcon, PersonIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Heading } from "@navikt/ds-react";
import type React from "react";
import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { OppdatereInntektRequestLosnet } from "../../../types/apiSpecFix";
import { DateToDDMMYYYYString, dateOrNull, isAfterDate } from "../../../utils/date-utils";
import { formatterBeløp } from "../../../utils/number-utils";
import { removePlaceholder } from "../../../utils/string-utils";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { createPayload, transformInntekt } from "../../helpers/inntektFormHelpers";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { useFomTomDato } from "../../hooks/useFomTomDato";
import { useOnSaveInntekt } from "../../hooks/useOnSaveInntekt";
import { useVirkningsdato } from "../../hooks/useVirkningsdato";
import type { InntektFormPeriode, InntektFormValues } from "../../types/inntektFormValues";
import type { InntektTables } from "../../types/inntektTableTypes";
import { BehandlingAlert } from "../BehandlingAlert";
import { FormControlledCheckbox } from "../formFields/FormControlledCheckbox";
import { FormControlledMonthPicker } from "../formFields/FormControlledMonthPicker";
import { FormControlledTextField } from "../formFields/FormControlledTextField";
import { OverlayLoader } from "../OverlayLoader";

import { useInntektTableProvider } from "./InntektTableContext";

export const KildeIcon = ({ kilde }: { kilde: Kilde }) => {
    return (
        <div className="w-full flex justify-center">
            {kilde === Kilde.OFFENTLIG ? (
                <Buildings2Icon title="Offentlig" fontSize="1.5rem" />
            ) : (
                <PersonIcon title="Manuelt" fontSize="1.5rem" />
            )}
        </div>
    );
};

export const TaMed = ({
    fieldName,
    handleOnSelect,
    index,
}: {
    fieldName: string;
    handleOnSelect: (checked: boolean, index: number) => void;
    index: number;
}) => {
    const { viewOnly } = useInntektTableProvider();

    if (viewOnly) return null;
    return (
        <div className="h-6 w-full flex items-center justify-center">
            <FormControlledCheckbox
                name={`${fieldName}.${index}.taMed`}
                onChange={(checked) => handleOnSelect(checked, index)}
                legend=""
            />
        </div>
    );
};

export const Totalt = ({ item, field }: { item: InntektFormPeriode; field: string }) => (
    <>
        {item.erRedigerbart && item.kilde === Kilde.MANUELL ? (
            <FormControlledTextField
                name={`${field}.beløp`}
                label="Totalt"
                type="number"
                min="1"
                inputMode="numeric"
                step="1"
                hideLabel
            />
        ) : (
            <div className="h-6 flex items-center justify-end">{formatterBeløp(item.beløp)}</div>
        )}
    </>
);

export const EditOrSaveButtonBulk = ({
    onEditRow,
    onSaveRow,
    items,
}: {
    onEditRow: () => boolean;
    onSaveRow: () => void;
    items: InntektFormPeriode[];
}) => {
    const { lesemodus } = useBehandlingProvider();
    const inEditMode = items.some((periode) => periode.kanBarnetilleggSkattesatsRedigeres);
    return (
        <div className="h-6 flex items-center justify-center">
            {!lesemodus && !inEditMode && (
                <Button
                    type="button"
                    onClick={onEditRow}
                    icon={<PencilIcon aria-hidden />}
                    variant="tertiary"
                    size="xsmall"
                />
            )}
            {!lesemodus && inEditMode && (
                <Button
                    type="button"
                    onClick={onSaveRow}
                    icon={<FloppydiskIcon aria-hidden />}
                    variant="tertiary"
                    size="xsmall"
                />
            )}
        </div>
    );
};

export const EditOrSaveButton = ({
    index,
    item,
    onEditRow,
    onSaveRow,
}: {
    item: InntektFormPeriode;
    index: number;
    onEditRow: (index: number) => void;
    onSaveRow: (index: number) => void;
}) => {
    const { lesemodus } = useBehandlingProvider();
    const { viewOnly } = useInntektTableProvider();

    if (item.kanRedigeres === false || viewOnly) return null;
    return (
        <div className="h-6 flex items-center justify-center">
            {!lesemodus && item.taMed && !item.erRedigerbart && (
                <Button
                    type="button"
                    onClick={() => onEditRow(index)}
                    icon={<PencilIcon aria-hidden />}
                    variant="tertiary"
                    size="xsmall"
                />
            )}
            {!lesemodus && item.erRedigerbart && (
                <Button
                    type="button"
                    onClick={() => onSaveRow(index)}
                    icon={<FloppydiskIcon aria-hidden />}
                    variant="tertiary"
                    size="xsmall"
                />
            )}
        </div>
    );
};

export const Periode = ({
    index,
    fieldName,
    field,
    label,
    item,
}: {
    index: number;
    fieldName: InntektTables;
    label: string;
    field: "datoFom" | "datoTom";
    item: InntektFormPeriode;
}) => {
    const { type } = useGetBehandlingV2();
    const fieldIsDatoTom = field === "datoTom";
    const [inntektType] = fieldName.split(".");
    const isBarnetilleggOrKontantstøtteTable = ["barnetillegg", "kontantstøtte"].includes(inntektType);
    const rolleId = isBarnetilleggOrKontantstøtteTable ? item.gjelderBarnId : item.gjelderRolleId;
    const [fom, tom] = useFomTomDato(fieldIsDatoTom, undefined, rolleId);
    const { getValues, clearErrors, setError } = useFormContext<InntektFormValues>();
    const { erVirkningstidspunktNåværendeMånedEllerFramITid, lesemodus } = useBehandlingProvider();
    const isSærbidragTypeAndFieldIsDatoFom = type === TypeBehandling.SAeRBIDRAG && !fieldIsDatoTom;

    const validateFomOgTom = () => {
        const periode = getValues(`${fieldName}.${index}`);
        const fomOgTomInvalid = !ObjectUtils.isEmpty(periode.datoTom) && isAfterDate(periode?.datoFom, periode.datoTom);

        if (fomOgTomInvalid) {
            setError(`${fieldName}.${index}.datoFom`, {
                type: "notValid",
                message: text.error.tomDatoKanIkkeVæreFørFomDato,
            });
        } else {
            clearErrors(`${fieldName}.${index}.datoFom`);
        }
    };

    return !isSærbidragTypeAndFieldIsDatoFom &&
        item.erRedigerbart &&
        !erVirkningstidspunktNåværendeMånedEllerFramITid &&
        item.kanRedigeres ? (
        <FormControlledMonthPicker
            name={`${fieldName}.${index}.${field}`}
            label={label}
            placeholder="DD.MM.ÅÅÅÅ"
            defaultValue={item[field]}
            fromDate={fom}
            customValidation={validateFomOgTom}
            toDate={tom}
            lastDayOfMonthPicker={fieldIsDatoTom}
            required={item.taMed && !fieldIsDatoTom}
            readonly={lesemodus}
            hideLabel
        />
    ) : (
        <div className="h-6 flex items-center">
            {item.taMed && item[field] && DateToDDMMYYYYString(dateOrNull(item[field]))}
        </div>
    );
};

export type InntektTabelChildrenProps = {
    controlledFields: InntektFormPeriode[];
    onEditRow: (index: number) => void;
    onSaveRow: (index: number) => void;
    updatedAndSave: (
        updatedValues: OppdatereInntektRequestLosnet,
        onSaveSuccess?: (data: OppdatereInntektResponse) => void,
        index?: number,
    ) => void;
    addPeriod: (periode: InntektFormPeriode) => void;
    handleOnSelect: (taMed: boolean, index: number) => void;
};

export const InntektTabel = ({
    fieldName,
    customRowValidation,
    children,
}: {
    fieldName: InntektTables;
    customRowValidation?: (fieldName: string) => void;
    children: (props: InntektTabelChildrenProps) => React.ReactNode;
}) => {
    const [inntektType, gjelderRolleId, gjelderBarnRolleId] = fieldName.split(".");
    const gjelderBarnRolleIdNumber = Number(gjelderBarnRolleId);
    const gjelderRolleIdNumber = Number(gjelderRolleId);
    const isBarnetilleggOrKontantstøtteTable = ["barnetillegg", "kontantstøtte"].includes(inntektType);
    const fomRolleIdForNewPeriod = isBarnetilleggOrKontantstøtteTable ? gjelderBarnRolleIdNumber : gjelderRolleIdNumber;
    const [fomForNewPeriod] = useFomTomDato(false, undefined, fomRolleIdForNewPeriod);
    const {
        lesemodus,
        setPageErrorsOrUnsavedState,
        setSaveErrorState,
        setBeregnetGebyrErEndret,
        setErrorMessage,
        setErrorModalOpen,
    } = useBehandlingProvider();
    const { inntekterV2: inntekter, virkningstidspunktV3: virkningstidspunkt } = useGetBehandlingV2();
    const inntektRolle = inntekter.find((rolle) => rolle.gjelder.id === gjelderRolleIdNumber);
    const inntekterByType = inntektRolle.inntekter[inntektType];
    const tableInntekter: InntektDtoV2[] = isBarnetilleggOrKontantstøtteTable
        ? inntekterByType.find((inntekt: InntektBarn) => inntekt.gjelderBarn.id === gjelderBarnRolleIdNumber).inntekter
        : inntekterByType;
    const selectedVirkningstidspunkt = virkningstidspunkt.barn.find((v) => v.rolle.id === gjelderBarnRolleIdNumber);
    const opphørsdato = selectedVirkningstidspunkt?.opphørsdato;
    const virkningsdato = useVirkningsdato(gjelderBarnRolleIdNumber);
    const saveInntekt = useOnSaveInntekt();
    const { control, getFieldState, getValues, clearErrors, setError, setValue, resetField, formState } =
        useFormContext<InntektFormValues>();
    const fieldArray = useFieldArray({
        control,
        name: fieldName,
    });

    const valideringsfeil = inntektRolle?.inntekter?.valideringsfeil;

    const watchFieldArray = useWatch({ control, name: fieldName });
    const controlledFields = fieldArray.fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray?.[index],
        };
    });

    useEffect(() => {
        setPageErrorsOrUnsavedState((state) => ({
            ...state,
            inntekt: {
                error:
                    !ObjectUtils.isEmpty(formState.errors.årsinntekter) ||
                    !ObjectUtils.isEmpty(formState.errors.barnetillegg) ||
                    !ObjectUtils.isEmpty(formState.errors.småbarnstillegg) ||
                    !ObjectUtils.isEmpty(formState.errors.kontantstøtte) ||
                    !ObjectUtils.isEmpty(formState.errors.utvidetBarnetrygd),
                openFields: {
                    ...state.inntekt.openFields,
                    [fieldName]: controlledFields.some(
                        (period) => !!period.erRedigerbart || !!period.kanBarnetilleggSkattesatsRedigeres,
                    ),
                },
            },
        }));
    }, [JSON.stringify(formState.errors), JSON.stringify(controlledFields)]);

    const handleOnSelect = (taMed: boolean, index: number) => {
        const periode = getValues(`${fieldName}.${index}`);
        const erOffentlig = periode.kilde === Kilde.OFFENTLIG;

        setValue(`${fieldName}.${index}`, {
            ...periode,
            erRedigerbart: periode.kanRedigeres && taMed,
        });

        if (!taMed && !erOffentlig) {
            handleDelete(index);
        } else {
            const inntekt = tableInntekter.find((inntekt) => inntekt.id === periode.id);
            const taMedHasChanged = inntekt.taMed !== taMed;
            if (taMedHasChanged && (!taMed || (taMed && !periode.kanRedigeres))) {
                handleUpdate(index);
            }
        }
    };

    const beholdOpprettetInntekterSomIkkeErLagret = (lagretInntekter: InntektFormPeriode[]): InntektFormPeriode[] => {
        const formInntekter = getValues(fieldName) ?? [];
        const alleInntekterId = new Map(lagretInntekter.map((inntekt) => [inntekt.id, inntekt]));

        const mergedInntekter = formInntekter.reduce((acc: InntektFormPeriode[], formInntekt) => {
            const erNyInntektIkkeLagret = !formInntekt.nyPeriodeSomLagres && formInntekt.id == null;

            if (erNyInntektIkkeLagret) {
                acc.push(formInntekt);
                return acc;
            }

            if (formInntekt.id != null) {
                const lagretInntekt = alleInntekterId.get(formInntekt.id);
                if (lagretInntekt) {
                    acc.push(lagretInntekt);
                    alleInntekterId.delete(formInntekt.id);
                }
            }

            return acc;
        }, []);

        return [...mergedInntekter, ...Array.from(alleInntekterId.values())].sort((a, b) => {
            const aFom = a.datoFom ? dateOrNull(a.datoFom) : null;
            const bFom = b.datoFom ? dateOrNull(b.datoFom) : null;
            return (aFom ? aFom.getTime() : 0) - (bFom ? bFom.getTime() : 0);
        });
    };

    const onSaveSuccess = (response: OppdatereInntektResponse) => {
        const transformFn = transformInntekt(virkningsdato);
        const inntektRolleFraResponse = response.inntekterV2.find((rolle) => rolle.gjelder.id === gjelderRolleIdNumber);

        const inntekter: InntektDtoV2[] = isBarnetilleggOrKontantstøtteTable
            ? inntektRolleFraResponse.inntekter[inntektType].find(
                  (inntekt: InntektBarn) => inntekt.gjelderBarn.id === gjelderBarnRolleIdNumber,
              )?.inntekter
            : inntektRolleFraResponse.inntekter[inntektType];

        const mergedInntekter = beholdOpprettetInntekterSomIkkeErLagret(inntekter.map(transformFn));

        resetField(fieldName, {
            defaultValue: mergedInntekter,
        });
    };

    const handleUpdate = (index: number) => {
        const updatedPeriode = getValues(`${fieldName}.${index}`);
        setValue(`${fieldName}.${index}`, { ...updatedPeriode, nyPeriodeSomLagres: true });
        const payload = createPayload(updatedPeriode, virkningsdato);
        updatedAndSave(payload, onSaveSuccess, index);
    };

    const handleDelete = async (index: number) => {
        const periode = getValues(`${fieldName}.${index}`);
        if (periode.id) {
            updatedAndSave({ sletteInntekt: periode.id }, onSaveSuccess, index);
        }
        clearErrors(`${fieldName}.${index}`);
        fieldArray.remove(index);
    };

    const addPeriod = (periode: InntektFormPeriode) => {
        fieldArray.append({
            ...periode,
            datoFom: toISODateString(fomForNewPeriod),
            erRedigerbart: true,
            kanRedigeres: true,
        });
    };
    const updatedAndSave = (
        updatedValues: OppdatereInntektRequestLosnet,
        onSaveSuccess?: (data: OppdatereInntektResponse) => void,
        index?: number,
    ) => {
        saveInntekt.mutation.mutate(updatedValues, {
            onSuccess: (response) => {
                setBeregnetGebyrErEndret(response.beregnetGebyrErEndret);
                onSaveSuccess?.(response);
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => updatedAndSave(updatedValues, onSaveSuccess, index),
                    rollbackFn: () => {
                        const value = getValues(`${fieldName}.${index}`);
                        if (updatedValues.sletteInntekt) {
                            const inntekt = tableInntekter.find((val) => val.id === updatedValues.sletteInntekt);
                            fieldArray.insert(index, { ...inntekt, erRedigerbart: false });
                        } else if (value.id == null) {
                            fieldArray.remove(index);
                        } else {
                            const valueIndex = getValues(fieldName).findIndex((val) => val.id === value.id);
                            const inntekt = tableInntekter.find((val) => val.id === value.id);
                            setValue(`${fieldName}.${valueIndex}`, inntekt);
                        }
                    },
                });
            },
        });
    };
    const onSaveRow = (index: number) => {
        const periode = getValues(`${fieldName}.${index}`);
        if (periode.datoFom === null) {
            setError(`${fieldName}.${index}.datoFom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
        }

        customRowValidation?.(`${fieldName}.${index}`);

        const fieldState = getFieldState(`${fieldName}.${index}`);
        if (!fieldState.error) {
            setValue(`${fieldName}.${index}`, { ...periode, erRedigerbart: false });
            handleUpdate(index);
        }
    };

    const showErrorModal = () => {
        setErrorMessage({
            title: text.alert.fullførRedigering,
            text: text.alert.periodeUnderRedigering,
        });
        setErrorModalOpen(true);
    };

    const onEditRow = (index: number) => {
        const perioder = getValues(fieldName);
        if (perioder.some((periode) => periode.erRedigerbart)) {
            showErrorModal();
        } else {
            setValue(`${fieldName}.${index}`, { ...perioder[index], erRedigerbart: true });
        }
    };

    const tableValideringsfeil: InntektValideringsfeil | undefined = isBarnetilleggOrKontantstøtteTable
        ? valideringsfeil[inntektType]?.find((feil) => feil.gjelderBarnRolle?.id === gjelderBarnRolleIdNumber)
        : valideringsfeil[inntektType];

    return (
        <>
            {!lesemodus && tableValideringsfeil && (
                <BehandlingAlert variant="warning" className="mb-4">
                    <Heading size="xsmall" level="6">
                        {text.alert.feilIPeriodisering}.
                    </Heading>
                    {tableValideringsfeil.overlappendePerioder.length > 0 && (
                        <>
                            {tableValideringsfeil.overlappendePerioder.map(({ periode }, index) => (
                                <BodyShort key={`${periode.fom}-${periode.tom}-${index}`} size="small">
                                    {periode.tom &&
                                        removePlaceholder(
                                            text.alert.overlappendePerioderInntekt,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                            DateToDDMMYYYYString(dateOrNull(periode.tom)),
                                        )}
                                    {!periode.tom &&
                                        removePlaceholder(
                                            text.alert.overlappendeLøpendePerioderInntekt,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                        )}
                                </BodyShort>
                            ))}
                            <BodyShort size="small">{text.alert.overlappendePerioderFiks}</BodyShort>
                        </>
                    )}
                    {tableValideringsfeil.hullIPerioder.length > 0 && (
                        <>
                            <BodyShort size="small">{text.error.hullIPerioderInntekt}:</BodyShort>
                            {tableValideringsfeil.hullIPerioder.map((gap, index) => (
                                <BodyShort key={`${gap.fom}-${gap.til}-${index}`} size="small">
                                    {DateToDDMMYYYYString(dateOrNull(gap.fom))} -{" "}
                                    {DateToDDMMYYYYString(dateOrNull(gap.til))}
                                </BodyShort>
                            ))}
                            <BodyShort size="small">{text.error.hullIPerioderFiks}</BodyShort>
                        </>
                    )}
                    {tableValideringsfeil.ingenLøpendePeriode && (
                        <BodyShort size="small">{text.error.ingenLoependeInntektPeriode}</BodyShort>
                    )}
                    {tableValideringsfeil.manglerPerioder && (
                        <BodyShort size="small">{text.error.manglerPerioder}</BodyShort>
                    )}
                    {tableValideringsfeil.fremtidigPeriode && (
                        <BodyShort size="small">{text.error.framoverPeriodisering}</BodyShort>
                    )}
                    {tableValideringsfeil.perioderFørVirkningstidspunkt && (
                        <BodyShort size="small">{text.error.periodeFørVirkningstidspunkt}</BodyShort>
                    )}
                    {tableValideringsfeil.manglerSkatteprosent && (
                        <BodyShort size="small">{text.error.barnetilleggSkattesatsMangler}</BodyShort>
                    )}
                    {tableValideringsfeil.ugyldigSluttPeriode && (
                        <BodyShort size="small">
                            {text.error.sistePeriodeMåSluttePåOpphørsdato.replace(
                                "{}",
                                DateToDDMMYYYYString(dateOrNull(opphørsdato)),
                            )}
                        </BodyShort>
                    )}
                </BehandlingAlert>
            )}
            <div
                className={`${saveInntekt.mutation.isPending ? "relative" : "inherit"} block overflow-x-auto whitespace-nowrap`}
            >
                {children({
                    controlledFields,
                    onEditRow,
                    onSaveRow,
                    addPeriod,
                    handleOnSelect,
                    updatedAndSave,
                })}
                <OverlayLoader loading={saveInntekt.mutation.isPending} />
            </div>
        </>
    );
};
