import {
    type BehandlingDtoV2,
    type FaktiskTilsynsutgiftDto,
    type OppdatereUnderholdResponse,
    SletteUnderholdselementTypeEnum,
    type StonadTilBarnetilsynDto,
    type TilleggsstonadDto,
} from "@bidrag/api/BidragBehandlingApiV1";
import { firstDayOfMonth, toISODateString } from "@bidrag/common";
import { BodyShort, Heading } from "@navikt/ds-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type React from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { OverlayLoader } from "../../../../common/components/OverlayLoader";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../../../common/hooks/useApiData";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import { DateToDDMMYYYYString, dateOrNull, maxOfDate } from "../../../../utils/date-utils";
import { removePlaceholder } from "../../../../utils/string-utils";

import type { UnderholdskostnadTables } from "../../../context/BarnebidragProviderWrapper";
import { useOnDeleteUnderholdsObjekt } from "../../../hooks/useOnDeleteUnderholdsObjekt";
import type {
    FaktiskTilsynsutgiftPeriode,
    StønadTilBarnetilsynPeriode,
    TilleggsstonadPeriode,
    UnderholdkostnadsFormPeriode,
    UnderholdskostnadFormValues,
} from "../../../types/underholdskostnadFormValues";
import { transformUnderholdskostnadPeriode } from "../helpers/UnderholdskostnadFormHelpers";

const fieldNameToSletteUnderholdselementTypeEnum = {
    stønadTilBarnetilsyn: SletteUnderholdselementTypeEnum.STONADTILBARNETILSYN,
    faktiskTilsynsutgift: SletteUnderholdselementTypeEnum.FAKTISK_TILSYNSUTGIFT,
    tilleggsstønad: SletteUnderholdselementTypeEnum.TILLEGGSSTONAD,
};

type UnderholdskostnadTableChildrenProps = {
    controlledFields: UnderholdkostnadsFormPeriode[];
    onRemovePeriode: (index: number) => void;
    onSaveRow: (index: number) => void;
    onEditRow: (index: number) => void;
    addPeriod: (periode: StønadTilBarnetilsynPeriode | FaktiskTilsynsutgiftPeriode | TilleggsstonadPeriode) => void;
};

export const UnderholdskostnadTabel = ({
    fieldName,
    customRowValidation,
    saveFn,
    createPayload,
    children,
}: {
    fieldName: UnderholdskostnadTables;
    customRowValidation?: (index: number) => void;
    saveFn: {
        mutation: UseMutationResult<
            OppdatereUnderholdResponse,
            Error,
            StonadTilBarnetilsynDto | FaktiskTilsynsutgiftDto | TilleggsstonadDto,
            unknown
        >;
        queryClientUpdater: (updateFn: (currentData: BehandlingDtoV2) => BehandlingDtoV2) => BehandlingDtoV2;
    };
    createPayload: (index: number) => StonadTilBarnetilsynDto | FaktiskTilsynsutgiftDto | TilleggsstonadDto;
    children: (props: UnderholdskostnadTableChildrenProps) => React.ReactNode;
}) => {
    const { underholdskostnader } = useGetBehandlingV2();
    const { lesemodus, setSaveErrorState, setErrorMessage, setErrorModalOpen, setPageErrorsOrUnsavedState } =
        useBehandlingProvider();
    const { control, clearErrors, setError, getValues, getFieldState, setValue } =
        useFormContext<UnderholdskostnadFormValues>();
    const fieldArray = useFieldArray({
        control,
        name: fieldName,
    });
    const watchFieldArray = useWatch({ control, name: fieldName });
    const controlledFields = fieldArray.fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray?.[index],
        };
    });

    const [underholdField, underholdIndexAsString, underholdskostnadType] = fieldName.split(".");
    const underholdIndex = Number(underholdIndexAsString);
    const underhold = getValues(
        `${underholdField as "underholdskostnaderMedIBehandling" | "underholdskostnaderAndreBarn"}.${underholdIndex}`,
    );
    const virkningsdato = useVirkningsdato(underhold.gjelderBarn.id);
    const deleteUnderhold = useOnDeleteUnderholdsObjekt();
    const refetchFFInfo = useRefetchFFInfoFn();

    const getPerioderFromResponse = (response: OppdatereUnderholdResponse) => {
        const updatedPerioder = response[underholdskostnadType] as
            | StonadTilBarnetilsynDto[]
            | FaktiskTilsynsutgiftDto[]
            | TilleggsstonadDto[];

        return updatedPerioder;
    };
    const updateTable = (
        updatedPerioder: StonadTilBarnetilsynDto[] | FaktiskTilsynsutgiftDto[] | TilleggsstonadDto[],
    ) => {
        const transformedUpdatedPerioder = updatedPerioder.map(transformUnderholdskostnadPeriode) as
            | StønadTilBarnetilsynPeriode[]
            | FaktiskTilsynsutgiftPeriode[]
            | TilleggsstonadPeriode[];
        setValue(fieldName, transformedUpdatedPerioder);
    };

    const queryUpdater = (response: OppdatereUnderholdResponse) => (currentData: BehandlingDtoV2) => {
        const updatedPerioder = getPerioderFromResponse(response);
        const cachedUnderholdIndex = currentData.underholdskostnader.findIndex((u) => u.id === underhold.id);

        return {
            ...currentData,
            underholdskostnader: currentData.underholdskostnader.map((cachedUnderhold, index) => {
                let updatedUnderhold = { ...cachedUnderhold };
                const updatedBeregnetUnderholdskostnad = response.beregnetUnderholdskostnader.find(
                    (bU) => bU.gjelderBarn.ident === cachedUnderhold.gjelderBarn.ident,
                );
                const updatedUnderholdskostnadValideringsfeiler = response.valideringsfeil.find(
                    (uV) => uV.id === cachedUnderhold.id,
                );

                updatedUnderhold = {
                    ...updatedUnderhold,
                    beregnetUnderholdskostnad: updatedBeregnetUnderholdskostnad
                        ? updatedBeregnetUnderholdskostnad.perioder
                        : cachedUnderhold.beregnetUnderholdskostnad,
                    valideringsfeil: updatedUnderholdskostnadValideringsfeiler
                        ? updatedUnderholdskostnadValideringsfeiler
                        : undefined,
                };

                if (index === cachedUnderholdIndex) {
                    updatedUnderhold = {
                        ...updatedUnderhold,
                        [underholdskostnadType]: updatedPerioder,
                    };
                }

                return updatedUnderhold;
            }),
        };
    };

    const saveRow = (index: number) => {
        const periode = getValues(`${fieldName}.${index}`);
        const editedPeriod = {
            ...periode,
            erRedigerbart: false,
        };
        setValue(`${fieldName}.${index}`, editedPeriod);

        const payload = createPayload(index);

        saveFn.mutation.mutate(payload, {
            onSuccess: (response) => {
                updateTable(getPerioderFromResponse(response));
                saveFn.queryClientUpdater(queryUpdater(response));
                const valideringsfeil = response.valideringsfeil.find((v) => v.id === response.underholdId);
                const fieldNameBegrunnelse =
                    underholdField === "underholdskostnaderAndreBarn"
                        ? ("underholdskostnaderAndreBarnBegrunnelse" as const)
                        : (`underholdskostnaderMedIBehandling.${underholdIndex}.begrunnelse` as const);
                if (valideringsfeil?.manglerBegrunnelse) {
                    setError(fieldNameBegrunnelse, {
                        type: "notValid",
                        message: text.error.feltErPåkrevd,
                    });
                } else {
                    clearErrors(fieldNameBegrunnelse);
                }
                refetchFFInfo();
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => saveRow(index),
                    rollbackFn: () => {
                        if (!periode.id) {
                            fieldArray.remove(index);
                        } else {
                            const cachedUnderhold = underholdskostnader.find((cU) => cU.id === underhold.id);
                            const cachedPeriode = cachedUnderhold[underholdskostnadType]?.find(
                                (p: StonadTilBarnetilsynDto | FaktiskTilsynsutgiftDto | TilleggsstonadDto) =>
                                    p.id === cachedPeriode.id,
                            );
                            setValue(`${fieldName}.${index}`, cachedPeriode);
                        }
                    },
                });
            },
        });
    };

    const onSaveRow = (index: number) => {
        customRowValidation?.(index);
        setPageErrorsOrUnsavedState((prevState) => ({
            ...prevState,
            underholdskostnad: {
                error: false,
                openFields: {
                    [fieldName]: false,
                },
            },
        }));
        const fieldState = getFieldState(`${fieldName}.${index}`);
        if (fieldState.error) return;

        saveRow(index);
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

        setPageErrorsOrUnsavedState((prevState) => ({
            ...prevState,
            underholdskostnad: {
                error: false,
                openFields: {
                    [fieldName]: true,
                },
            },
        }));
        if (perioder.some((periode) => periode.erRedigerbart)) {
            showErrorModal();
        } else {
            setValue(`${fieldName}.${index}`, { ...perioder[index], erRedigerbart: true });
        }
    };

    const onRemovePeriode = (index: number) => {
        const periode = getValues(`${fieldName}.${index}`);
        setPageErrorsOrUnsavedState((prevState) => ({
            ...prevState,
            underholdskostnad: {
                error: false,
                openFields: {
                    [fieldName]: false,
                },
            },
        }));
        if (periode.id) {
            const payload = {
                idUnderhold: underhold.id,
                idElement: periode.id,
                type: fieldNameToSletteUnderholdselementTypeEnum[underholdskostnadType],
            };

            deleteUnderhold.mutation.mutate(payload, {
                onSuccess: (response) => {
                    clearErrors(`${fieldName}.${index}`);
                    updateTable(getPerioderFromResponse(response));
                    deleteUnderhold.queryClientUpdater(queryUpdater(response));
                    const valideringsfeil = response.valideringsfeil.find((v) => v.id === response.underholdId);
                    const fieldNameBegrunnelse =
                        underholdField === "underholdskostnaderAndreBarn"
                            ? ("underholdskostnaderAndreBarnBegrunnelse" as const)
                            : (`underholdskostnaderMedIBehandling.${underholdIndex}.begrunnelse` as const);
                    if (valideringsfeil?.manglerBegrunnelse) {
                        setError(fieldNameBegrunnelse, {
                            type: "notValid",
                            message: text.error.feltErPåkrevd,
                        });
                    } else {
                        clearErrors(fieldNameBegrunnelse);
                    }
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onRemovePeriode(index),
                    });
                },
            });
        } else {
            clearErrors(`${fieldName}.${index}`);
            fieldArray.remove(index);
        }
    };

    const addPeriod = (periode: StønadTilBarnetilsynPeriode | FaktiskTilsynsutgiftPeriode | TilleggsstonadPeriode) => {
        setPageErrorsOrUnsavedState((prevState) => ({
            ...prevState,
            underholdskostnad: {
                error: false,
                openFields: {
                    [fieldName]: true,
                },
            },
        }));
        const fødselsdato = firstDayOfMonth(dateOrNull(underhold.gjelderBarn.fødselsdato));
        const virkningEllerFødselsdato = fødselsdato ? maxOfDate(virkningsdato, fødselsdato) : virkningsdato;

        fieldArray.append({
            ...periode,
            datoFom: toISODateString(virkningEllerFødselsdato as Date),
            erRedigerbart: true,
            kanRedigeres: true,
        });
    };

    const mutationIsPending = saveFn.mutation.isPending || deleteUnderhold.mutation.isPending;

    const valideringsfeil = underholdskostnader.find(
        (u) => u.gjelderBarn.id === underhold.gjelderBarn.id,
    )?.valideringsfeil;
    const tilleggsstønadsperioderUtenFaktiskTilsynsutgift =
        !!valideringsfeil?.tilleggsstønadsperioderUtenFaktiskTilsynsutgift.length;
    const tableValideringsfeil = valideringsfeil?.[underholdskostnadType];
    const displayTilleggsstønadsperioderUtenFaktiskTilsynsutgiftError =
        underholdskostnadType === "tilleggsstønad" && tilleggsstønadsperioderUtenFaktiskTilsynsutgift;
    const tableHasErrors = tableValideringsfeil || displayTilleggsstønadsperioderUtenFaktiskTilsynsutgiftError;

    return (
        <>
            {!lesemodus && tableHasErrors && (
                <BehandlingAlert variant="warning" className="mb-4">
                    <Heading size="xsmall" level="6">
                        {text.alert.feilIPeriodisering}.
                    </Heading>
                    {displayTilleggsstønadsperioderUtenFaktiskTilsynsutgiftError && (
                        <BodyShort size="small">{text.error.tilleggsstønadsperioderUtenFaktiskTilsynsutgift}</BodyShort>
                    )}
                    {tableValideringsfeil?.overlappendePerioder?.length > 0 && (
                        <>
                            {tableValideringsfeil?.overlappendePerioder?.map(({ periode }, index) => (
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
                    {tableValideringsfeil?.ugyldigPerioder?.length > 0 && (
                        <>
                            {tableValideringsfeil?.ugyldigPerioder?.map((periode, index) => (
                                <BodyShort key={`${periode.fom}-${periode.tom}-${index}`} size="small">
                                    {periode.tom &&
                                        removePlaceholder(
                                            text.alert.ugyldigPerioderBarnetilsyn,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                            DateToDDMMYYYYString(dateOrNull(periode.tom)),
                                        )}
                                    {!periode.tom &&
                                        removePlaceholder(
                                            text.alert.ugyldigLøpendePerioderBarnetilsyn,
                                            DateToDDMMYYYYString(dateOrNull(periode.fom)),
                                        )}
                                </BodyShort>
                            ))}
                            <BodyShort size="small">{text.alert.ugyldigPerioderBarnetilsynFiks}</BodyShort>
                        </>
                    )}
                    {tableValideringsfeil?.fremtidigePerioder?.length > 0 && (
                        <BodyShort size="small">{text.error.framoverPeriodisering}</BodyShort>
                    )}
                    {tableValideringsfeil?.harIngenPerioder && (
                        <BodyShort size="small">{text.error.manglerPerioderUnderhold}</BodyShort>
                    )}
                </BehandlingAlert>
            )}
            <div className={`${mutationIsPending ? "relative" : "inherit"} block overflow-x-auto whitespace-nowrap`}>
                <OverlayLoader loading={mutationIsPending} />
                {children({
                    controlledFields,
                    onEditRow,
                    onSaveRow,
                    addPeriod,
                    onRemovePeriode,
                })}
            </div>
        </>
    );
};
