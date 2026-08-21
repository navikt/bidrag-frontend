import {
    Bostatuskode,
    type BostatusperiodeDto,
    Engangsbeloptype,
    type HusstandsmedlemDtoV2,
    Kilde,
    type OppdatereBoforholdRequestV2,
    OpplysningerType,
    Stonadstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ObjectUtils } from "@bidrag/common";
import { ArrowUndoIcon, FloppydiskIcon, PencilIcon, TrashIcon } from "@navikt/aksel-icons";
import { Button, Heading, Table } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { RelaxSpecTypes } from "../../../types/apiSpecFix";
import { DateToDDMMYYYYString, dateOrNull, formatDateToYearMonth, isAfterEqualsDate } from "../../../utils/date-utils";
import elementIds from "../../constants/elementIds";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import {
    boforholdOptions,
    getFirstDayOfMonthAfterEighteenYears,
    gyldigBostatus18ÅrsBidragSøknadsbarn,
    gyldigBostatusOver18År,
    isOver18YearsOld,
    skalViseOver18Statuser as skalViseOver18BoforholdStatuser,
} from "../../helpers/boforholdFormHelpers";
import { actionOnEnter } from "../../helpers/keyboardHelpers";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../hooks/useApiData";
import { useFieldMutationStatus } from "../../hooks/useFieldMutationStatus";
import { useOnSaveBoforhold } from "../../hooks/useOnSaveBoforhold";
import { hentVisningsnavn } from "../../hooks/useVisningsnavn";
import type { BoforholdFormValues } from "../../types/boforholdFormValues";
import { BehandlingAlert } from "../BehandlingAlert";
import { FormControlledSelectField } from "../formFields/FormControlledSelectField";
import { KildeIcon } from "../inntekt/InntektTable";
import { OverlayLoader } from "../OverlayLoader";
import StatefulAlert from "../StatefulAlert";
import { BoforholdOpplysninger } from "./BoforholdOpplysninger";
import { Periode } from "./Periode";

const DeleteButton = ({
    onRemovePeriode,
    barn,
    index,
}: {
    onRemovePeriode: (index) => void;
    barn: HusstandsmedlemDtoV2;
    index: number;
}) => {
    const { lesemodus } = useBehandlingProvider();
    const { type } = useGetBehandlingV2();
    const barnIsOver18 = isOver18YearsOld(barn.fødselsdato);
    const firstOver18PeriodIndex = barn.perioder.findIndex((period) =>
        gyldigBostatusOver18År[type].includes(period.bostatus),
    );
    const showDeleteButton = barnIsOver18 && index === firstOver18PeriodIndex ? false : !!index;

    return showDeleteButton && !lesemodus ? (
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

    return editableRow ? (
        <Button
            type="button"
            onClick={() => onSaveRow(index)}
            icon={<FloppydiskIcon aria-hidden />}
            variant="tertiary"
            size="xsmall"
        />
    ) : (
        <Button
            type="button"
            onClick={() => onEditRow(index)}
            icon={<PencilIcon aria-hidden />}
            variant="tertiary"
            size="xsmall"
        />
    );
};

const Status = ({
    editableRow,
    fieldName,
    barn,
    item,
}: {
    editableRow: boolean;
    fieldName: `husstandsmedlem.${number}.perioder.${number}`;
    barn: HusstandsmedlemDtoV2;
    item: BostatusperiodeDto;
}) => {
    const { type, engangsbeløptype, virkningstidspunktV3, roller } = useGetBehandlingV2();
    const erSærbidrag = engangsbeløptype === Engangsbeloptype.SAeRBIDRAG;
    const sammeBarnUnder18År = roller.some((r) => r.ident === barn.ident && r.stønadstype !== Stonadstype.BIDRAG18AAR);
    const bidrag18ÅrOgSøknadsbarn = barn.stønadstype === Stonadstype.BIDRAG18AAR && barn.medIBehandling;
    const { clearErrors } = useFormContext<BoforholdFormValues>();
    const bosstatusToVisningsnavn = (bostsatus: Bostatuskode): string => {
        const visningsnavn = hentVisningsnavn(bostsatus);
        // Ønsker ikke å vise 18 år prefiks for 18 åring i 18års bidrag
        const bosstatus18År = bidrag18ÅrOgSøknadsbarn && !sammeBarnUnder18År ? [] : gyldigBostatusOver18År[type];
        if (
            (bidrag18ÅrOgSøknadsbarn && sammeBarnUnder18År) ||
            (bosstatus18År.includes(bostsatus) &&
                skalViseOver18BoforholdStatuser(
                    barn,
                    erSærbidrag ? virkningstidspunktV3.eldsteVirkningstidspunkt : undefined,
                ))
        ) {
            return `18 ${text.år}: ${visningsnavn}`;
        }
        return visningsnavn;
    };

    const boforholdStatusOptions = bidrag18ÅrOgSøknadsbarn
        ? sammeBarnUnder18År
            ? boforholdOptions[type].over18År
            : boforholdOptions[type].bidrag18År
        : skalViseOver18BoforholdStatuser(barn)
          ? boforholdOptions[type].likEllerOver18År
          : boforholdOptions[type].under18År;

    return editableRow ? (
        <FormControlledSelectField
            name={`${fieldName}.bostatus`}
            className="w-fit"
            label={text.label.status}
            options={boforholdStatusOptions.map((value) => ({
                value,
                text: bosstatusToVisningsnavn(value),
            }))}
            hideLabel
            onSelect={() => clearErrors(`${fieldName}.bostatus`)}
        />
    ) : (
        <div className="h-6 flex items-center">{bosstatusToVisningsnavn(item.bostatus)}</div>
    );
};
export const Perioder = ({ barnIndex }: { barnIndex: number }) => {
    const {
        boforhold: { valideringsfeil },
        virkningstidspunktV3: virkningstidspunkt,
        feilOppståttVedSisteGrunnlagsinnhenting,
    } = useGetBehandlingV2();
    const {
        behandlingId,
        lesemodus,
        erVirkningstidspunktNåværendeMånedEllerFramITid,
        setErrorMessage,
        setErrorModalOpen,
        setPageErrorsOrUnsavedState,
        setSaveErrorState,
    } = useBehandlingProvider();
    const [showUndoButton, setShowUndoButton] = useState(false);
    const [showResetButton, setShowResetButton] = useState(false);
    const [editableRow, setEditableRow] = useState<`${number}.${number}`>(undefined);
    const behandling = useGetBehandlingV2();
    const saveBoforhold = useOnSaveBoforhold();
    const tableMutationStatus = useFieldMutationStatus(saveBoforhold.mutation, "periodeUpdate");
    const { control, getValues, clearErrors, setError, setValue, getFieldState, formState } =
        useFormContext<BoforholdFormValues>();
    const barnPerioder = useFieldArray({
        control,
        name: `husstandsmedlem.${barnIndex}.perioder`,
    });
    const watchFieldArray = useWatch({ control, name: `husstandsmedlem.${barnIndex}.perioder` });
    const controlledFields = barnPerioder.fields.map((field, index) => ({
        ...field,
        ...watchFieldArray[index],
    }));
    const erSærbidrag = behandling.engangsbeløptype === Engangsbeloptype.SAeRBIDRAG;
    const barn = getValues(`husstandsmedlem.${barnIndex}`);
    const barnIsOver18 = isOver18YearsOld(
        barn.fødselsdato,
        erSærbidrag ? behandling.virkningstidspunktV3.eldsteVirkningstidspunkt : undefined,
    );
    const monthAfter18 = getFirstDayOfMonthAfterEighteenYears(new Date(barn.fødselsdato));
    const feilVedInnhentingAvOffentligData = feilOppståttVedSisteGrunnlagsinnhenting?.some(
        (innhentingsFeil) =>
            innhentingsFeil.rolle.ident === barn.ident &&
            innhentingsFeil.grunnlagsdatatype === OpplysningerType.BOFORHOLD,
    );
    const selectedVirkningstidspunkt = virkningstidspunkt.barn.find((v) => v.rolle.ident === barn.ident);
    const opphørsdato = selectedVirkningstidspunkt?.opphørsdato;
    const refetchFFInfo = useRefetchFFInfoFn();

    useEffect(() => {
        setPageErrorsOrUnsavedState((state) => ({
            ...state,
            boforhold: {
                error:
                    !ObjectUtils.isEmpty(formState.errors?.husstandsmedlem) ||
                    !ObjectUtils.isEmpty(formState.errors?.sivilstand),
                openFields: {
                    ...state.boforhold.openFields,
                    [`husstandsmedlem.${barnIndex}`]: !!editableRow,
                },
            },
        }));
    }, [JSON.stringify(formState.errors), editableRow]);

    const onSaveRow = (index: number) => {
        const periodeValues = getValues(`husstandsmedlem.${barnIndex}.perioder.${index}`);
        if (periodeValues?.datoFom === null) {
            setError(`husstandsmedlem.${barnIndex}.perioder.${index}.datoFom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
        }

        const selectedPeriodeId = periodeValues.id;
        const selectedStatus = periodeValues.bostatus;
        const selectedDatoFom = periodeValues?.datoFom;
        const selectedDatoTom = periodeValues?.datoTom;

        const bidrag18ÅrOgSøknadsbarn = barn.stønadstype === Stonadstype.BIDRAG18AAR && barn.medIBehandling;

        if (barnIsOver18 && !barn.medIBehandling) {
            const selectedStatusIsOver18 = bidrag18ÅrOgSøknadsbarn
                ? gyldigBostatus18ÅrsBidragSøknadsbarn[behandling.type]
                : gyldigBostatusOver18År[behandling.type].includes(selectedStatus);
            const selectedStatusIsUnder18 = (
                bidrag18ÅrOgSøknadsbarn
                    ? gyldigBostatus18ÅrsBidragSøknadsbarn[behandling.type]
                    : boforholdOptions[behandling.type].under18År
            ).includes(selectedStatus);
            const selectedDatoFomIsAfterOrSameAsMonthOver18 = isAfterEqualsDate(selectedDatoFom, monthAfter18);
            const isInvalidStatusOver18 =
                !selectedStatusIsOver18 &&
                (selectedDatoFomIsAfterOrSameAsMonthOver18 ||
                    selectedDatoTom === null ||
                    isAfterEqualsDate(selectedDatoTom, monthAfter18));
            const isInvalidStatusUnder18 = !selectedStatusIsUnder18 && !selectedDatoFomIsAfterOrSameAsMonthOver18;

            if (isInvalidStatusOver18) {
                setError(`husstandsmedlem.${barnIndex}.perioder.${index}.bostatus`, {
                    message: text.error.ugyldigBoststatusEtter18,
                });
            } else if (isInvalidStatusUnder18) {
                setError(`husstandsmedlem.${barnIndex}.perioder.${index}.bostatus`, {
                    message: text.error.ugyldigBoststatusFør18,
                });
            } else {
                clearErrors(`husstandsmedlem.${barnIndex}.perioder.${index}.bostatus`);
            }
        }

        const fieldState = getFieldState(`husstandsmedlem.${barnIndex}.perioder.${index}`);

        if (!fieldState.error) {
            updateAndSave({
                oppdatereHusstandsmedlem: {
                    oppdaterPeriode: {
                        idHusstandsbarn: barn.id,
                        idHusstandsmedlem: barn.id,
                        idPeriode: selectedPeriodeId,
                        periode: {
                            fom: formatDateToYearMonth(selectedDatoFom),
                            til: formatDateToYearMonth(selectedDatoTom),
                        },
                        datoFom: selectedDatoFom,
                        datoTom: selectedDatoTom,
                        bostatus: selectedStatus,
                    },
                },
            });
        }
    };

    const undoAction = () => {
        updateAndSave({
            oppdatereHusstandsmedlem: {
                angreSisteStegForHusstandsmedlem: barn.id,
            },
        });
    };

    const updateAndSave = (payload: RelaxSpecTypes<OppdatereBoforholdRequestV2>) => {
        saveBoforhold.mutation.mutate(
            { triggeredBy: "periodeUpdate", ...payload },
            {
                onSuccess: (response) => {
                    // Set datoTom til null ellers resettes den ikke
                    barnPerioder.replace(
                        response.oppdatertHusstandsmedlem.perioder.map((d) => ({
                            ...d,
                            datoTom: d.datoTom ?? null,
                        })),
                    );
                    refetchFFInfo();
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => updateAndSave(payload),
                        rollbackFn: () => {
                            const oppdaterPeriode = payload.oppdatereHusstandsmedlem.oppdaterPeriode;
                            if (oppdaterPeriode && oppdaterPeriode.idPeriode == null) {
                                const perioder = getValues(`husstandsmedlem.${barnIndex}.perioder`);
                                barnPerioder.remove(perioder.length - 1);
                            } else {
                                setValue(
                                    `husstandsmedlem.${barnIndex}`,
                                    behandling.boforhold.husstandsmedlem.find((b) => b.id === barn.id),
                                );
                            }

                            if (payload.oppdatereHusstandsmedlem.tilbakestillPerioderForHusstandsmedlem) {
                                setShowResetButton(true);
                            }
                        },
                    });
                },
            },
        );

        setShowUndoButton(true);
        setShowResetButton(true);
        setEditableRow(undefined);
    };

    const addPeriode = () => {
        if (checkIfAnotherRowIsEdited()) {
            showErrorModal();
        } else {
            const perioderValues = getValues(`husstandsmedlem.${barnIndex}.perioder`);
            const bidrag18ÅrOgSøknadsbarn = !skalViseOver18BoforholdStatuser(barn);

            barnPerioder.append({
                datoFom: null,
                datoTom: null,
                bostatus: isOver18YearsOld(barn.fødselsdato)
                    ? bidrag18ÅrOgSøknadsbarn
                        ? Bostatuskode.IKKE_MED_FORELDER
                        : Bostatuskode.REGNES_IKKE_SOM_BARN
                    : Bostatuskode.MED_FORELDER,
                kilde: Kilde.MANUELL,
            });

            setEditableRow(`${barnIndex}.${perioderValues.length}`);
        }
    };

    const removeAndCleanUpPeriodeAndErrors = (index: number) => {
        clearErrors(`husstandsmedlem.${barnIndex}.perioder.${index}`);
        barnPerioder.remove(index);
        setEditableRow(undefined);
    };

    const onRemovePeriode = (index: number) => {
        if (checkIfAnotherRowIsEdited(index)) {
            showErrorModal();
        } else {
            const periode = getValues(`husstandsmedlem.${barnIndex}.perioder.${index}`);

            if (periode.id) {
                if (periode.kilde === Kilde.MANUELL) {
                    saveBoforhold.mutation.mutate(
                        { triggeredBy: "periodeUpdate", oppdatereHusstandsmedlem: { slettPeriode: periode.id } },
                        {
                            onSuccess: (response) => {
                                barnPerioder.replace(
                                    response.oppdatertHusstandsmedlem.perioder.map((d) => ({
                                        ...d,
                                        datoTom: d.datoTom ?? null,
                                    })),
                                );
                                clearErrors(`husstandsmedlem.${barnIndex}.perioder.${index}`);
                                setEditableRow(undefined);
                            },
                            onError: () => {
                                setSaveErrorState({
                                    error: true,
                                    retryFn: () => onRemovePeriode(index),
                                    rollbackFn: () => {
                                        setValue(
                                            `husstandsmedlem.${barnIndex}`,
                                            behandling.boforhold.husstandsmedlem.find((b) => b.id === barn.id),
                                        );
                                    },
                                });
                            },
                        },
                    );
                }

                if (periode.kilde === Kilde.OFFENTLIG) {
                    updateAndSave({
                        oppdatereHusstandsmedlem: {
                            oppdaterPeriode: {
                                idHusstandsbarn: barn.id,
                                idHusstandsmedlem: barn.id,
                                idPeriode: periode.id,
                                datoFom: periode.datoFom,
                                datoTom: periode.datoTom,
                                periode: {
                                    fom: formatDateToYearMonth(periode.datoFom),
                                    til: formatDateToYearMonth(periode.datoTom),
                                },
                                bostatus:
                                    periode.bostatus === Bostatuskode.MED_FORELDER
                                        ? Bostatuskode.IKKE_MED_FORELDER
                                        : Bostatuskode.MED_FORELDER,
                            },
                        },
                    });
                }
            } else {
                removeAndCleanUpPeriodeAndErrors(index);
            }
        }
    };

    const resetTilDataFraFreg = () => {
        const barn = getValues(`husstandsmedlem.${barnIndex}`);
        updateAndSave({ oppdatereHusstandsmedlem: { tilbakestillPerioderForHusstandsmedlem: barn.id } });
        setShowResetButton(false);
    };

    const checkIfAnotherRowIsEdited = (index?: number) => {
        const editableRowIndex = editableRow?.split(".")[1];
        return editableRowIndex && Number(editableRowIndex) !== index;
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
            setEditableRow(`${barnIndex}.${index}`);
        }
    };

    const valideringsfeilForBarn = valideringsfeil?.husstandsmedlem?.find(
        (feil) => feil.barn.husstandsmedlemId === barn.id,
    );

    return (
        <div className="grid gap-2 pl-4">
            <BoforholdOpplysninger
                ident={barn.ident}
                showResetButton={showResetButton}
                onActivateOpplysninger={(overskrevetManuelleOpplysninger) => {
                    setShowUndoButton((prevValue) => prevValue || overskrevetManuelleOpplysninger);
                    setShowResetButton(!overskrevetManuelleOpplysninger);
                }}
                resetTilDataFraFreg={resetTilDataFraFreg}
                fieldName={`husstandsmedlem.${barnIndex}.perioder`}
            />
            {barnIsOver18 && !lesemodus && (
                <StatefulAlert
                    variant="info"
                    size="small"
                    alertKey={`18åralert${behandlingId}${barn.ident}`}
                    className="w-[708px]"
                    closeButton
                >
                    <Heading size="small" level="3">
                        {text.title.barnOver18}
                    </Heading>
                    {text.barnetHarFylt18SjekkBostatus}
                </StatefulAlert>
            )}
            {feilVedInnhentingAvOffentligData && (
                <BehandlingAlert variant="info" className="w-[708px]">
                    <Heading size="small" level="3">
                        {text.alert.feilVedInnhentingAvOffentligData}
                    </Heading>
                    {text.feilVedInnhentingAvOffentligData}
                </BehandlingAlert>
            )}
            {valideringsfeilForBarn && !lesemodus && (
                <div>
                    <BehandlingAlert variant="warning">
                        <Heading spacing size="small" level="3">
                            {text.alert.feilIPeriodisering}
                        </Heading>
                        {valideringsfeilForBarn.fremtidigPeriode && <p>{text.error.framoverPeriodisering}</p>}
                        {valideringsfeilForBarn.hullIPerioder.length > 0 && <p>{text.error.hullIPerioder}</p>}
                        {valideringsfeilForBarn.ingenLøpendePeriode && <p>{text.error.ingenLoependePeriode}</p>}
                        {valideringsfeilForBarn.ugyldigSluttperiode && opphørsdato && (
                            <p>
                                {text.error.sistePeriodeMåSluttePåOpphørsdato.replace(
                                    "{}",
                                    DateToDDMMYYYYString(dateOrNull(opphørsdato)),
                                )}
                            </p>
                        )}
                    </BehandlingAlert>
                </div>
            )}

            {controlledFields.length > 0 && (
                <div
                    className={`${
                        tableMutationStatus === "pending" ? "relative" : "inherit"
                    } block overflow-x-auto whitespace-nowrap`}
                    data-section={elementIds.seksjon_perioder}
                >
                    <OverlayLoader loading={tableMutationStatus === "pending"} />
                    <Table size="small" className="table-fixed table bg-[white] w-full">
                        <Table.Header>
                            <Table.Row className="align-baseline">
                                <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[154px]">
                                    {text.label.fraOgMed}
                                </Table.HeaderCell>
                                <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[154px]">
                                    {text.label.tilOgMed}
                                </Table.HeaderCell>
                                <Table.HeaderCell textSize="small" scope="col" align="left">
                                    {text.label.status}
                                </Table.HeaderCell>
                                <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[54px]">
                                    {text.label.kilde}
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" className="w-[56px]" textSize="small"></Table.HeaderCell>
                                <Table.HeaderCell scope="col" className="w-[56px]" textSize="small"></Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {controlledFields.map((item, index) => (
                                <Table.Row
                                    key={item?.id}
                                    className="align-top gap-2"
                                    onKeyDown={actionOnEnter(() => onSaveRow(index))}
                                >
                                    <Table.DataCell textSize="small">
                                        <Periode
                                            editableRow={editableRow === `${barnIndex}.${index}`}
                                            label={text.label.fraOgMed}
                                            fieldName={`husstandsmedlem.${barnIndex}.perioder.${index}`}
                                            field="datoFom"
                                            item={item}
                                            barn={barn}
                                        />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <Periode
                                            editableRow={editableRow === `${barnIndex}.${index}`}
                                            label={text.label.tilOgMed}
                                            fieldName={`husstandsmedlem.${barnIndex}.perioder.${index}`}
                                            field="datoTom"
                                            item={item}
                                            barn={barn}
                                        />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <Status
                                            item={item}
                                            editableRow={editableRow === `${barnIndex}.${index}`}
                                            fieldName={`husstandsmedlem.${barnIndex}.perioder.${index}`}
                                            barn={barn}
                                        />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <KildeIcon kilde={item.kilde} />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <EditOrSaveButton
                                            index={index}
                                            editableRow={editableRow === `${barnIndex}.${index}`}
                                            onEditRow={onEditRow}
                                            onSaveRow={onSaveRow}
                                        />
                                    </Table.DataCell>
                                    <Table.DataCell textSize="small">
                                        <DeleteButton index={index} onRemovePeriode={onRemovePeriode} barn={barn} />
                                    </Table.DataCell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            )}
            <div className="grid gap-2">
                {showUndoButton && (
                    <Button
                        variant="tertiary"
                        type="button"
                        size="small"
                        className="w-fit"
                        onClick={undoAction}
                        iconPosition="right"
                        icon={<ArrowUndoIcon aria-hidden />}
                    >
                        {text.label.angreSisteSteg}
                    </Button>
                )}
                {!lesemodus && !erVirkningstidspunktNåværendeMånedEllerFramITid && !erSærbidrag && (
                    <Button variant="tertiary" type="button" size="small" className="w-fit" onClick={addPeriode}>
                        {text.label.leggTilPeriode}
                    </Button>
                )}
            </div>
        </div>
    );
};
