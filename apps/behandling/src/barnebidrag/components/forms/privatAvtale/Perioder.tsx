import {
    type OppdaterePrivatAvtaleRequest,
    type PrivatAvtaleAndreBarnDtoV2,
    type PrivatAvtaleBarnDto,
    type PrivatAvtaleBarnInfoDto,
    type PrivatAvtaleValideringsfeilDto,
    Samvaersklasse,
    Valutakode,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ObjectUtils } from "@bidrag/common";
import { FloppydiskIcon, PencilIcon, TrashIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Heading, Table } from "@navikt/ds-react";
import { useMemo, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { FormControlledMonthPicker } from "../../../../common/components/formFields/FormControlledMonthPicker";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import { FormControlledTextField } from "../../../../common/components/formFields/FormControlledTextField";
import { OverlayLoader } from "../../../../common/components/OverlayLoader";
import elementIds from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { actionOnEnter } from "../../../../common/helpers/keyboardHelpers";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../../../common/hooks/useApiData";
import { hentVisningsnavn } from "../../../../common/hooks/useVisningsnavn";
import {
    addMonthsIgnoreDay,
    DateToDDMMYYYYString,
    DateToMMYYYYString,
    dateOrNull,
    isAfterDate,
} from "../../../../utils/date-utils";
import { formatterBeløp } from "../../../../utils/number-utils";
import { removePlaceholder } from "../../../../utils/string-utils";

import { useOnUpdatePrivatAvtale } from "../../../hooks/useOnUpdatePrivatAvtale";
import type {
    PrivatAvtaleFormValues,
    PrivatAvtaleFormValuesPerBarn,
    PrivatAvtalePeriode,
} from "../../../types/privatAvtaleFormValues";
import { transformPrivatAvtalePeriode } from "../helpers/PrivatAvtaleHelpers";
import { getFomForPrivatAvtale, getTomForPrivatAvtale } from "./PrivatAvtale";

const Periode = ({
    item,
    field,
    fieldName,
    label,
    editableRow,
    privatAvtale,
}: {
    item: PrivatAvtalePeriode;
    fieldName: `${"roller" | "andreBarn"}.${number}.privatAvtale.perioder.${number}`;
    field: "fom" | "tom";
    label: string;
    editableRow: boolean;
    privatAvtale: PrivatAvtaleAndreBarnDtoV2 | PrivatAvtaleBarnInfoDto;
}) => {
    const { roller } = useGetBehandlingV2();
    const { lesemodus } = useBehandlingProvider();
    const { getValues, clearErrors, setError } = useFormContext<PrivatAvtaleFormValues>();
    const selectedRolle = roller.find(
        (rolle) =>
            (privatAvtale as PrivatAvtaleBarnInfoDto)?.erSøknadsbarn && rolle.id === privatAvtale.gjelderBarn?.id,
    );
    const fieldIsDatoTom = field === "tom";

    const fom = useMemo(() => {
        return getFomForPrivatAvtale(
            selectedRolle?.stønadstype ?? privatAvtale.gjelderBarn?.stønadstype,
            privatAvtale.gjelderBarn.fødselsdato,
        );
    }, [selectedRolle?.stønadstype, privatAvtale.gjelderBarn.fødselsdato, privatAvtale.gjelderBarn?.stønadstype]);
    const tom = useMemo(
        () =>
            getTomForPrivatAvtale(
                privatAvtale.gjelderBarn.fødselsdato,
                selectedRolle?.stønadstype ?? privatAvtale.gjelderBarn?.stønadstype,
            ),
        [
            selectedRolle?.fødselsdato,
            selectedRolle?.stønadstype,
            privatAvtale.gjelderBarn.fødselsdato,
            privatAvtale.gjelderBarn?.stønadstype,
        ],
    );

    const validateFomOgTom = () => {
        const periode = getValues(fieldName);
        const fomOgTomInvalid = !ObjectUtils.isEmpty(periode.tom) && isAfterDate(periode?.fom, periode.tom);

        if (fomOgTomInvalid) {
            setError(`${fieldName}.fom`, {
                type: "notValid",
                message: text.error.tomDatoKanIkkeVæreFørFomDato,
            });
        } else {
            clearErrors(`${fieldName}.fom`);
        }
    };

    return !lesemodus && editableRow ? (
        <FormControlledMonthPicker
            name={`${fieldName}.${field}`}
            label={label}
            placeholder="DD.MM.ÅÅÅÅ"
            defaultValue={item[field]}
            customValidation={validateFomOgTom}
            fromDate={fom}
            toDate={fieldIsDatoTom ? tom : addMonthsIgnoreDay(tom, 1)}
            lastDayOfMonthPicker={fieldIsDatoTom}
            required={!fieldIsDatoTom}
            hideLabel
        />
    ) : (
        <div className="h-6 flex items-center">{item[field] && DateToDDMMYYYYString(dateOrNull(item[field]))}</div>
    );
};

const Beløp = ({ item, editableRow, field }: { item: PrivatAvtalePeriode; editableRow: boolean; field: string }) => {
    const { lesemodus } = useBehandlingProvider();
    return (
        <>
            {!lesemodus && editableRow ? (
                <FormControlledTextField
                    name={field}
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
};

const Valuta = ({
    item,
    gjelderUtland,
    field,
    editableRow,
}: {
    item: PrivatAvtalePeriode;
    gjelderUtland: boolean;
    field: `${"roller" | "andreBarn"}.${number}.privatAvtale.perioder.${number}.valutakode`;
    editableRow: boolean;
}) => {
    const { lesemodus } = useBehandlingProvider();
    return (
        <>
            {!lesemodus && editableRow && gjelderUtland && (
                <FormControlledSelectField
                    name={field}
                    label={text.label.valuta}
                    className="w-max max-h-[10px]"
                    hideLabel
                >
                    <option value="">{text.select.velgValuta}</option>
                    {Object.keys(Valutakode).map((value) => (
                        <option key={value} value={value}>
                            {hentVisningsnavn(value)}
                        </option>
                    ))}
                </FormControlledSelectField>
            )}{" "}
            {(lesemodus || !editableRow) && gjelderUtland && item.valutakode && (
                <div className="h-6 flex items-center justify-start">{hentVisningsnavn(item.valutakode)}</div>
            )}
            {!gjelderUtland && (
                <div className="h-6 flex items-center justify-start">{hentVisningsnavn(Valutakode.NOK)}</div>
            )}
        </>
    );
};

const SamværsklasseSelect = ({
    item,
    field,
    editableRow,
}: {
    item: PrivatAvtalePeriode;
    field: `${"roller" | "andreBarn"}.${number}.privatAvtale.perioder.${number}.samværsklasse`;
    editableRow: boolean;
}) => {
    const { lesemodus } = useBehandlingProvider();
    return (
        <>
            {!lesemodus && editableRow ? (
                <FormControlledSelectField
                    name={field}
                    label={text.label.samvær}
                    className="w-max max-h-[10px]"
                    hideLabel
                >
                    <option value="">{text.select.defaultSamværsklasseOption}</option>
                    {Object.values(Samvaersklasse).map((value) => (
                        <option key={value} value={value}>
                            {hentVisningsnavn(value)}
                        </option>
                    ))}
                </FormControlledSelectField>
            ) : (
                <div className="h-6 flex items-center justify-start">
                    {item.samværsklasse ? hentVisningsnavn(item.samværsklasse) : ""}{" "}
                </div>
            )}
        </>
    );
};

const EditOrSaveButton = ({
    index,
    editableRow,
    onSaveRow,
    onEditRow,
}: {
    index: number;
    editableRow: boolean;
    onSaveRow: (index: number) => void;
    onEditRow: (index: number) => void;
}) => {
    const { lesemodus } = useBehandlingProvider();

    if (lesemodus) return null;

    return (
        <div className="h-6 flex items-center justify-center">
            {editableRow && (
                <Button
                    type="button"
                    onClick={() => onSaveRow(index)}
                    icon={<FloppydiskIcon aria-hidden />}
                    variant="tertiary"
                    size="xsmall"
                />
            )}
            {!editableRow && (
                <Button
                    type="button"
                    onClick={() => onEditRow(index)}
                    icon={<PencilIcon aria-hidden />}
                    variant="tertiary"
                    size="xsmall"
                />
            )}
        </div>
    );
};

const DeleteButton = ({ onRemovePeriode, index }: { onRemovePeriode: (index) => void; index: number }) => {
    const { lesemodus } = useBehandlingProvider();

    return !lesemodus ? (
        <Button
            type="button"
            onClick={() => onRemovePeriode(index)}
            icon={<TrashIcon aria-hidden />}
            variant="tertiary"
            size="xsmall"
        />
    ) : (
        <div className="min-w-[40px]"></div>
    );
};

export const Perioder = ({
    prefix,
    barnIndex,
    privatAvtaleItem,
    valideringsfeil,
}: {
    prefix: "roller" | "andreBarn";
    barnIndex: number;
    privatAvtaleItem: PrivatAvtaleFormValuesPerBarn;
    valideringsfeil: PrivatAvtaleValideringsfeilDto;
}) => {
    const { privatAvtaleV3: privatAvtale } = useGetBehandlingV2();
    const { lesemodus, setErrorMessage, setErrorModalOpen, setSaveErrorState } = useBehandlingProvider();
    const selectedPrivatAvtale =
        prefix === "andreBarn"
            ? privatAvtale.andreBarn.barn.find((barn) => barn?.privatAvtale?.id === privatAvtaleItem?.avtaleId)
            : privatAvtale.søknadsbarn.find((barn) => barn?.privatAvtale?.id === privatAvtaleItem?.avtaleId);
    const [editableRow, setEditableRow] = useState<number>(undefined);
    const updatePrivatAvtaleQuery = useOnUpdatePrivatAvtale(privatAvtaleItem.avtaleId);
    const { control, clearErrors, getValues, setValue, setError, getFieldState } =
        useFormContext<PrivatAvtaleFormValues>();
    const refetchFFInfo = useRefetchFFInfoFn();

    const barnFieldArray = useFieldArray({
        control,
        name: `${prefix}.${barnIndex}.privatAvtale.perioder`,
    });
    const watchFieldArray = useWatch({ control, name: `${prefix}.${barnIndex}.privatAvtale.perioder` });
    const controlledFields = barnFieldArray.fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray[index],
        };
    });

    const validateRow = (index: number) => {
        const periode = getValues(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}`);
        let error = false;
        if (periode.fom === null) {
            setError(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}.fom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
            error = true;
        }
        if (periode.valutakode === "" && privatAvtaleItem.gjelderUtland) {
            setError(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}.valutakode`, {
                type: "notValid",
                message: text.error.valuta,
            });
            error = true;
        } else {
            clearErrors(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}.valutakode`);
        }
        return error;
    };

    const onSaveRow = (index: number) => {
        const hasError = validateRow(index);
        const fieldState = getFieldState(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}`);

        if (hasError || fieldState.error) return;

        const periode = getValues(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}`);
        let payload: OppdaterePrivatAvtaleRequest = {
            oppdaterPeriode: {
                periode: {
                    fom: periode.fom,
                    tom: periode.tom,
                },
                beløp: periode.beløp,
                samværsklasse: periode.samværsklasse === "" ? null : periode.samværsklasse,
                valutakode: periode.valutakode === "" ? null : periode.valutakode,
            },
        };

        if (periode.id) {
            payload = { oppdaterPeriode: { ...payload.oppdaterPeriode, id: periode.id } };
        }

        updatePrivatAvtaleQuery.mutation.mutate(payload, {
            onSuccess: (response) => {
                refetchFFInfo();
                setEditableRow(undefined);
                if (!periode.id) {
                    const updatedPrivateAvtale =
                        prefix === "andreBarn"
                            ? response.privatAvtale.andreBarn.barn
                                  .filter((b) => b.privatAvtale)
                                  .find((barn) => barn.privatAvtale.id === privatAvtaleItem.avtaleId)
                            : response.privatAvtale.søknadsbarn
                                  .filter((b) => b.privatAvtale)
                                  .find((barn) => barn.privatAvtale.id === privatAvtaleItem.avtaleId);
                    setValue(
                        `${prefix}.${barnIndex}.privatAvtale.perioder`,
                        updatedPrivateAvtale.privatAvtale.perioder.map(transformPrivatAvtalePeriode),
                    );
                }
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onSaveRow(index),
                });
            },
        });
    };

    const addPeriode = () => {
        const perioderValues = getValues(`${prefix}.${barnIndex}.privatAvtale.perioder`);
        const sortedPerioderValues = perioderValues?.sort((a, b) => (new Date(a.fom) > new Date(b.fom) ? 1 : -1));
        const previousPeriode = sortedPerioderValues?.[perioderValues.length - 1];

        barnFieldArray.append({
            fom: null,
            tom: null,
            beløp: 0,
            valutakode: previousPeriode?.valutakode ?? Valutakode.NOK,
            samværsklasse: previousPeriode?.samværsklasse ?? "",
        });
        setEditableRow(perioderValues.length);
    };

    const checkIfAnotherRowIsEdited = (index?: number) => {
        return editableRow && Number(editableRow) !== index;
    };

    const showErrorModal = () => {
        setErrorMessage({
            title: text.alert.fullførRedigering,
            text: text.alert.periodeUnderRedigering,
        });
        setErrorModalOpen(true);
    };

    const onEditRow = (index: number) => {
        if (checkIfAnotherRowIsEdited(index)) {
            showErrorModal();
        } else {
            setEditableRow(index);
        }
    };

    const onRemovePeriode = (index: number) => {
        if (checkIfAnotherRowIsEdited(index)) {
            showErrorModal();
        } else {
            const periode = getValues(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}`);
            const removeAndCleanPeriodeErrors = () => {
                clearErrors(`${prefix}.${barnIndex}.privatAvtale.perioder.${index}`);
                barnFieldArray.remove(index);
                setEditableRow(undefined);
            };

            if (periode.id) {
                updatePrivatAvtaleQuery.mutation.mutate(
                    { slettePeriodeId: periode.id },
                    {
                        onSuccess: () => {
                            removeAndCleanPeriodeErrors();
                        },
                        onError: () => {
                            setSaveErrorState({
                                error: true,
                                retryFn: () => onRemovePeriode(index),
                            });
                        },
                    },
                );
            } else {
                removeAndCleanPeriodeErrors();
            }
        }
    };

    const tableValideringsfeil = valideringsfeil?.harPeriodiseringsfeil;

    return (
        <div className="grid gap-2">
            {!lesemodus &&
                prefix === "roller" &&
                (selectedPrivatAvtale as PrivatAvtaleBarnDto)?.perioderLøperBidrag?.length > 0 && (
                    <BehandlingAlert variant="info">
                        <Heading size="xsmall" level="6">
                            {text.alert.løpendeBidrag}.
                        </Heading>
                        <BodyShort size="small">
                            {removePlaceholder(
                                text.alert.løpendeBidragPerioder,
                                (selectedPrivatAvtale as PrivatAvtaleBarnDto).perioderLøperBidrag
                                    .map(
                                        (p) =>
                                            `${DateToMMYYYYString(dateOrNull(p.fom))} - ${DateToMMYYYYString(dateOrNull(p.til)) ?? ""}`,
                                    )
                                    .join(", "),
                            )}
                            .
                        </BodyShort>
                    </BehandlingAlert>
                )}
            {!lesemodus && tableValideringsfeil && (
                <BehandlingAlert variant="warning">
                    <Heading size="xsmall" level="6">
                        {text.alert.feilIPeriodisering}.
                    </Heading>
                    {valideringsfeil?.perioderOverlapperMedLøpendeBidrag?.length > 0 && (
                        <>
                            {valideringsfeil?.perioderOverlapperMedLøpendeBidrag?.map((periode, index) => (
                                <BodyShort key={`${periode.fom}-${periode.til}-${index}`} size="small">
                                    {periode.til &&
                                        removePlaceholder(
                                            text.alert.overlappendeLøpendeBidragPerioder,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                            DateToDDMMYYYYString(dateOrNull(periode.til)),
                                            selectedPrivatAvtale.perioderLøperBidrag
                                                .map(
                                                    (p) =>
                                                        `${DateToMMYYYYString(dateOrNull(p.fom))} - ${DateToMMYYYYString(dateOrNull(p.til)) ?? ""}`,
                                                )
                                                .join(", "),
                                        )}
                                    {!periode.til &&
                                        removePlaceholder(
                                            text.alert.overlappendeLøpendeBidragPerioderForLøpende,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                            selectedPrivatAvtale.perioderLøperBidrag
                                                .map(
                                                    (p) =>
                                                        `${DateToMMYYYYString(dateOrNull(p.fom))} - ${DateToMMYYYYString(dateOrNull(p.til)) ?? ""}`,
                                                )
                                                .join(", "),
                                        )}
                                </BodyShort>
                            ))}
                            <BodyShort size="small">{text.alert.overlappendePerioderFiks}</BodyShort>
                        </>
                    )}
                    {!lesemodus && valideringsfeil?.overlappendePerioder?.length > 0 && (
                        <>
                            {valideringsfeil?.overlappendePerioder?.map(({ periode }, index) => (
                                <BodyShort key={`${periode.fom}-${periode.tom}-${index}`} size="small">
                                    {periode.tom &&
                                        removePlaceholder(
                                            text.alert.overlappendePerioder,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                            DateToDDMMYYYYString(dateOrNull(periode.tom)),
                                        )}
                                    {!periode.tom &&
                                        removePlaceholder(
                                            text.alert.overlappendeLøpendePerioder,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                        )}
                                </BodyShort>
                            ))}
                            <BodyShort size="small">{text.alert.overlappendePerioderFiks}</BodyShort>
                        </>
                    )}
                    {!lesemodus && valideringsfeil?.ingenLøpendePeriode && (
                        <BodyShort size="small">{text.error.ingenLøpendePeriode}</BodyShort>
                    )}
                    {!lesemodus && valideringsfeil?.finnesPerioderEtter18Årsdag && (
                        <BodyShort size="small">
                            Du kan ikke legge til perioder etter barnet har fylt 18 år når privat avtalen gjelder
                            ordinær bidrag
                        </BodyShort>
                    )}
                    {!lesemodus && valideringsfeil?.finnesPerioderFør18Årsdag && (
                        <BodyShort size="small">
                            Du kan ikke legge til perioder før barnet har fylt 18 år når privat avtalen gjelder 18 års
                            bidrag
                        </BodyShort>
                    )}
                </BehandlingAlert>
            )}
            {controlledFields.length > 0 && (
                <div
                    className={`${
                        updatePrivatAvtaleQuery.mutation.isPending ? "relative" : "inherit"
                    } block overflow-x-auto whitespace-nowrap`}
                    data-section={elementIds.seksjon_perioder}
                >
                    <OverlayLoader loading={updatePrivatAvtaleQuery.mutation.isPending} />
                    <Table size="small" className="table-fixed table bg-[white] w-full">
                        <Table.Header>
                            <Table.Row className="align-baseline">
                                <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                                    {text.label.fraOgMed}
                                </Table.HeaderCell>
                                <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                                    {text.label.tilOgMed}
                                </Table.HeaderCell>
                                <Table.HeaderCell textSize="small" scope="col" align="right">
                                    {text.label.beløp}
                                </Table.HeaderCell>
                                {prefix === "andreBarn" && (
                                    <Table.HeaderCell textSize="small" scope="col" className="w-[200px]">
                                        {text.label.valuta}
                                    </Table.HeaderCell>
                                )}
                                {prefix === "andreBarn" && (
                                    <Table.HeaderCell textSize="small" scope="col" className="w-[240px]">
                                        {text.label.samvær}
                                    </Table.HeaderCell>
                                )}
                                <Table.HeaderCell
                                    scope="col"
                                    className="w-[56px]"
                                    textSize="small"
                                    align="center"
                                ></Table.HeaderCell>
                                <Table.HeaderCell
                                    scope="col"
                                    className="w-[56px]"
                                    textSize="small"
                                    align="center"
                                ></Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {controlledFields.map((item, index) => (
                                <Table.Row
                                    key={item?.id}
                                    className="align-top"
                                    onKeyDown={actionOnEnter(() => onSaveRow(index))}
                                >
                                    <Table.DataCell textSize="small">
                                        <Periode
                                            label={text.label.fraOgMed}
                                            fieldName={`${prefix}.${barnIndex}.privatAvtale.perioder.${index}`}
                                            field="fom"
                                            item={item}
                                            editableRow={editableRow === index}
                                            privatAvtale={selectedPrivatAvtale}
                                        />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <Periode
                                            label={text.label.tilOgMed}
                                            fieldName={`${prefix}.${barnIndex}.privatAvtale.perioder.${index}`}
                                            field="tom"
                                            item={item}
                                            editableRow={editableRow === index}
                                            privatAvtale={selectedPrivatAvtale}
                                        />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <Beløp
                                            item={item}
                                            editableRow={editableRow === index}
                                            field={`${prefix}.${barnIndex}.privatAvtale.perioder.${index}.beløp`}
                                        />
                                    </Table.DataCell>
                                    {prefix === "andreBarn" && (
                                        <Table.DataCell textSize="small">
                                            <Valuta
                                                gjelderUtland={privatAvtaleItem.gjelderUtland}
                                                item={item}
                                                editableRow={editableRow === index}
                                                field={`${prefix}.${barnIndex}.privatAvtale.perioder.${index}.valutakode`}
                                            />
                                        </Table.DataCell>
                                    )}
                                    {prefix === "andreBarn" && (
                                        <Table.DataCell textSize="small">
                                            <SamværsklasseSelect
                                                item={item}
                                                editableRow={editableRow === index}
                                                field={`${prefix}.${barnIndex}.privatAvtale.perioder.${index}.samværsklasse`}
                                            />
                                        </Table.DataCell>
                                    )}
                                    <Table.DataCell textSize="small">
                                        <EditOrSaveButton
                                            index={index}
                                            editableRow={editableRow === index}
                                            onEditRow={onEditRow}
                                            onSaveRow={onSaveRow}
                                        />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <DeleteButton index={index} onRemovePeriode={onRemovePeriode} />
                                    </Table.DataCell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            )}
            <div className="grid gap-2">
                {!lesemodus && (
                    <Button variant="tertiary" type="button" size="small" className="w-fit" onClick={addPeriode}>
                        {text.label.leggTilPeriode}
                    </Button>
                )}
            </div>
        </div>
    );
};
