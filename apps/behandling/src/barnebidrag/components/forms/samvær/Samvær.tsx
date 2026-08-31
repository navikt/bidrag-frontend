import {
    type OppdaterSamvaerDto,
    Rolletype,
    type SamvaerBarnDto,
    Samvaersklasse,
    type SletteSamvaersperiodeElementDto,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { deductDays, PersonNavn, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { FloppydiskIcon, PencilIcon, TrashIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Button, Heading, Switch, Table } from "@navikt/ds-react";
import type React from "react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { ConfirmationModal } from "../../../../common/components/modal/ConfirmationModal";
import { OverlayLoader } from "../../../../common/components/OverlayLoader";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import Tabs from "../../../../common/components/wrappingtabs/WrappingTabs";
import elementIds from "../../../../common/constants/elementIds";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { actionOnEnter } from "../../../../common/helpers/keyboardHelpers";
import {
    createInitialValues,
    createSamværInitialValues,
    createSamværskalkulatorDefaultvalues,
    createSamværsperiodeInitialValues,
    mapToSamværskalkulatoDetaljer,
} from "../../../../common/helpers/samværFormHelpers";
import { useActiveSamværTab } from "../../../../common/hooks/useActiveSamværTab";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { usePageTabs } from "../../../../common/hooks/usePageTabs";
import { useOnDeleteSamværsperiode, useOnSaveSamvær } from "../../../../common/hooks/useSaveSamvær";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import type { SamværBarnformvalues, SamværPeriodeFormvalues } from "../../../../common/types/samværFormValues";
import {
    addDays,
    addMonthsIgnoreDay,
    DateToDDMMYYYYString,
    dateOrNull,
    getStartOfNextMonth,
    toISODateString,
} from "../../../../utils/date-utils";
import { BarnebidragStepper } from "../../../enum/BarnebidragStepper";
import { useGetSamværMedBarn } from "../../../hooks/useGetSamværBarn";
import { useOnMergeSamvær } from "../../../hooks/useOnMergeSamvær";
import PersonIdentSak from "../../PersonIdentSak";
import { BegrunnelseSidemeny } from "../BegrunnelseSidemeny";
import { SamværsklasseSelector } from "./SamværklasseSelector";
import { SamværskalkulatorButton, SamværskalkulatorForm } from "./Samværskalkulator";
import { Samværsperiode } from "./Samværsperiode";

const SamværForm = () => {
    const samvær = useGetSamværMedBarn();
    const { setVurderSeparatSamvær: setVurderSeparat } = useBehandlingProvider();
    const erSammeRef = useRef(samvær.erSammeForAlle);
    const initialValues = useMemo(() => createInitialValues(samvær.barn), [samvær.barn]);

    const ref = useRef(null);
    const useFormMethods = useForm({
        defaultValues: initialValues,
        criteriaMode: "all",
    });

    useEffect(() => {
        erSammeRef.current = samvær.erSammeForAlle;
    }, [samvær.erSammeForAlle]);

    useEffect(() => {
        return () => setVurderSeparat(!erSammeRef.current);
    }, []);

    return (
        <FormProvider {...useFormMethods}>
            <form ref={ref} onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout title={text.title.samvær} main={<Main />} side={<Side />} />
            </form>
        </FormProvider>
    );
};

const Side = () => {
    const { erBisysVedtak, vedtakstype } = useGetBehandlingV2();
    const {
        onStepChange,
        setSaveErrorState,
        getNextStep,
        vurderSeparatSamvær: vurderSeparat,
        selectedRoller,
    } = useBehandlingProvider();
    const vurderSeparatRef = useRef(vurderSeparat);
    const samvær = useGetSamværMedBarn();
    const saveSamværFn = useOnSaveSamvær();
    const { watch, getValues, setValue, setError, clearErrors } = useFormContext<SamværBarnformvalues>();

    const visibleSamværBarn = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));
        if (visibleIds.size === 0) {
            return samvær.barn;
        }
        const filtered = samvær.barn.filter((barn) => visibleIds.has(barn.barn.id));
        return filtered.length > 0 ? filtered : samvær.barn;
    }, [samvær.barn, selectedRoller]);
    const { selectedBarn: oppdaterSamvær } = useActiveSamværTab(visibleSamværBarn);
    const mutationState = useFieldMutationStatus(saveSamværFn.mutation, `${oppdaterSamvær?.barn.id}.begrunnelse`);

    const [previousValues, setPreviousValues] = useState<string>(
        () => getValues(`${oppdaterSamvær?.barn.id}.begrunnelse`) ?? "",
    );

    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;

    useEffect(() => {
        vurderSeparatRef.current = vurderSeparat;
    }, [vurderSeparat]);

    function updateBegrunnelseError(oppdaterRolle: SamvaerBarnDto) {
        const valideringsfeil = oppdaterRolle?.valideringsfeil;
        if (valideringsfeil?.manglerBegrunnelse) {
            setError(`${oppdaterRolle?.barn.id}.begrunnelse`, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        } else {
            clearErrors(`${oppdaterRolle?.barn.id}.begrunnelse`);
        }
    }

    useEffect(() => {
        updateBegrunnelseError(oppdaterSamvær);
    }, [oppdaterSamvær?.barn.id]);

    const onSave = useCallback(
        async (fieldName: string, payload: OppdaterSamvaerDto) => {
            try {
                const response = await saveSamværFn.mutation.mutateAsync({ triggeredBy: fieldName, ...payload });

                response.samværBarn.forEach((barn) => {
                    if (payload.barnId !== barn.barn.id && payload.sammeForAlle) {
                        setValue(
                            `${barn.barn.id}.begrunnelse`,
                            response.samværBarn.find((s) => s.barn.id === barn.barn.id).begrunnelse.innhold,
                        );

                        updateBegrunnelseError(barn);
                    } else if (payload.barnId === barn.barn.id) {
                        updateBegrunnelseError(barn);
                    }
                });
                setPreviousValues(response.samværBarn.find((s) => s.barn.id === payload.barnId).begrunnelse.innhold);
            } catch {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onSave(`${payload.barnId}.begrunnelse`, payload),
                    rollbackFn: () => {
                        setValue(`${payload.barnId}.begrunnelse`, previousValues ?? "");
                    },
                });
            }
        },
        [saveSamværFn, previousValues, setValue, setSaveErrorState],
    );
    const onNext = () => onStepChange(getNextStep(BarnebidragStepper.SAMVÆR));

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name?.includes(`${oppdaterSamvær.barn.id}.begrunnelse`) && type === "change") {
                const begrunnelse = value[oppdaterSamvær.barn.id].begrunnelse;
                const payload = {
                    sammeForAlle: !vurderSeparatRef.current,
                    gjelderBarn: oppdaterSamvær.gjelderBarn,
                    barnId: oppdaterSamvær.barn.id,
                    oppdatereBegrunnelse: {
                        nyBegrunnelse: begrunnelse,
                    },
                };
                debouncedOnSave(name, payload);
            }
        });
        return () => subscription.unsubscribe();
    }, [oppdaterSamvær.gjelderBarn, debouncedOnSave, watch]);

    return (
        <Fragment key={oppdaterSamvær.id}>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <BegrunnelseSidemeny
                    label={text.title.begrunnelse}
                    name={`${oppdaterSamvær.barn.id}.begrunnelse`}
                    description={text.description.samværBegrunnelse}
                    mutationState={mutationState}
                    resize
                />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && oppdaterSamvær.begrunnelseFraOpprinneligVedtak && (
                <CustomTextareaEditor
                    name={`${oppdaterSamvær.barn.id}.begrunnelseFraOpprinneligVedtak`}
                    label={text.label.begrunnelseFraOpprinneligVedtak}
                    value={oppdaterSamvær.begrunnelseFraOpprinneligVedtak.innhold}
                    resize
                    readOnly
                />
            )}
            <ActionButtons onNext={onNext} />
        </Fragment>
    );
};

const Main = () => {
    const { forholdsmessigFordeling } = useGetBehandlingV2();
    const samvær = useGetSamværMedBarn();
    const { reset } = useFormContext<SamværBarnformvalues>();
    const {
        onNavigateToTab,
        setSaveErrorState,
        lesemodus,
        vurderSeparatSamvær: vurderSeparat,
        setVurderSeparatSamvær: setVurderSeparat,
        activeStep,
        selectedRoller,
    } = useBehandlingProvider();
    const mergeSamværMutation = useOnMergeSamvær();
    const ref = useRef<HTMLDialogElement>(null);
    const visibleSamværBarn = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));
        if (visibleIds.size === 0) {
            return samvær.barn;
        }
        const filtered = samvær.barn.filter((barn) => visibleIds.has(barn.barn.id));
        return filtered.length > 0 ? filtered : samvær.barn;
    }, [samvær.barn, selectedRoller]);

    const { selectedTab, defaultTab } = useActiveSamværTab(visibleSamværBarn);

    const onMergeSamvær = () => {
        mergeSamværMutation.mutation.mutate(undefined, {
            onSuccess: (response) => {
                setVurderSeparat(false);
                reset(createInitialValues(response.samværV2.barn));
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onMergeSamvær(),
                    rollbackFn: () => void 0,
                });
            },
            onSettled: () => {
                ref?.current?.close();
            },
        });
    };
    usePageTabs({
        items: visibleSamværBarn,
        mapToTab: (barn) => ({
            id: barn.id.toString(),
            label: barn.barn.rolletype,
        }),
        selectedTabId: selectedTab,
        enabled: vurderSeparat && visibleSamværBarn.length > 1 && activeStep === BarnebidragStepper.SAMVÆR,
    });

    return (
        <div>
            <ConfirmationModal
                ref={ref}
                closeable
                description={text.varsel.ønskerDuÅSlåSammenVerdierDescription}
                heading={<Heading size="small">{text.varsel.ønskerDuÅSlåSammenVerdier}</Heading>}
                footer={
                    <>
                        <Button
                            type="button"
                            onClick={onMergeSamvær}
                            size="small"
                            loading={mergeSamværMutation.mutation.isPending}
                        >
                            {text.label.ja}
                        </Button>
                        <Button type="button" variant="secondary" size="small" onClick={() => ref.current?.close()}>
                            {text.label.avbryt}
                        </Button>
                    </>
                }
            />
            {samvær.barn.length > 1 && !forholdsmessigFordeling && samvær.erVirkningSammeForAlle && (
                <Switch
                    value="erLikForAlle"
                    checked={vurderSeparat}
                    readOnly={lesemodus}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setVurderSeparat(e.target.checked);
                        }
                        if (!e.target.checked) {
                            ref.current?.showModal();
                        }
                    }}
                    size="small"
                >
                    {text.label.vurderSeparatPerBarn}
                </Switch>
            )}
            {vurderSeparat && visibleSamværBarn.length > 1 && (
                <Tabs
                    defaultValue={defaultTab}
                    value={selectedTab}
                    onChange={onNavigateToTab}
                    className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm w-full"
                >
                    <Tabs.List>
                        {visibleSamværBarn.map((barn) => (
                            <Tabs.Tab
                                key={barn.id}
                                value={barn.id.toString()}
                                className="[&>*:first-child]:w-max p-2.5"
                                label={
                                    <PersonIdentSak
                                        ident={barn.gjelderBarn}
                                        rolle={Rolletype.BA}
                                        stønadstype={barn.barn.stønadstype}
                                    />
                                }
                            />
                        ))}
                    </Tabs.List>
                    {visibleSamværBarn.map((barn) => {
                        return (
                            <Tabs.Panel key={barn.id} value={barn.id.toString()} className="grid gap-y-4">
                                <SamværBarn gjelderBarn={barn.gjelderBarn} gjelderBarnId={barn.barn.id} />
                            </Tabs.Panel>
                        );
                    })}
                </Tabs>
            )}
            {(visibleSamværBarn.length === 1 || !vurderSeparat) && (
                <SamværBarn
                    gjelderBarn={visibleSamværBarn[0].gjelderBarn}
                    gjelderBarnId={visibleSamværBarn[0].barn.id}
                />
            )}
        </div>
    );
};
export const SamværBarn = ({ gjelderBarn, gjelderBarnId }: { gjelderBarn: string; gjelderBarnId: number }) => {
    const {
        lesemodus,
        erVirkningstidspunktNåværendeMånedEllerFramITid,
        setErrorMessage,
        setErrorModalOpen,
        setSaveErrorState,
        vurderSeparatSamvær: vurderSeparat,
    } = useBehandlingProvider();

    const [editableRow, setEditableRow] = useState<number>(undefined);
    const [previousPeriodeTom, setPreviousPeriodeTom] = useState<string | null>(null);
    const behandling = useGetBehandlingV2();
    const saveSamværFn = useOnSaveSamvær();
    const deleteSamværFn = useOnDeleteSamværsperiode();
    const updatingTableStatus = useFieldMutationStatus(saveSamværFn.mutation, "tableUpdate");
    const tableUpdatePending = deleteSamværFn.mutation.status === "pending" || updatingTableStatus === "pending";
    const virkningsdato = useVirkningsdato(gjelderBarnId);
    const samværBarn = useGetSamværMedBarn();
    const { control, getValues, clearErrors, setError, getFieldState, setValue } =
        useFormContext<SamværBarnformvalues>();
    const perioder = useFieldArray({
        control,
        name: `${gjelderBarnId}.perioder`,
    });
    const watchFieldArray = useWatch({ control, name: `${gjelderBarnId}.perioder` });
    const samvær = samværBarn.barn.find((s) => s.barn.id === gjelderBarnId);
    const virkningstidspunkt = behandling.virkningstidspunktV3.barn.find((v) => v.rolle.id === gjelderBarnId);
    const samværId = samvær?.id;
    const controlledFields = perioder.fields.map((field, index) => ({
        ...field,
        ...watchFieldArray?.[index],
    }));

    const displayRoleDetails = samværBarn.barn.length === 1;

    const validateRow = (periodeValues: SamværPeriodeFormvalues, index: number) => {
        if (periodeValues?.fom === null) {
            setError(`${gjelderBarnId}.perioder.${index}.fom`, {
                type: "notValid",
                message: text.error.datoMåFyllesUt,
            });
            return false;
        }
        return true;
    };

    const onSaveRow = (index: number) => {
        const periodeValues = getValues(`${gjelderBarnId}.perioder.${index}`);
        const validRow = validateRow(periodeValues, index);

        if (!validRow) return;

        const selectedPeriodeId = periodeValues.id;
        const selectedSamvær = periodeValues.samværsklasse;
        const selectedDatoFom = periodeValues?.fom;
        const selectedDatoTom = periodeValues?.tom;

        const fieldState = getFieldState(`${gjelderBarnId}.perioder.${index}`);

        if (!fieldState.error) {
            const beregningMapped = mapToSamværskalkulatoDetaljer(periodeValues.beregning);
            updateAndSave({
                sammeForAlle: !vurderSeparat,
                periode: {
                    id: Number(selectedPeriodeId),
                    samværsklasse: beregningMapped ? null : selectedSamvær,
                    periode: {
                        fom: selectedDatoFom,
                        tom: selectedDatoTom,
                    },
                    beregning: beregningMapped,
                },
                gjelderBarn: gjelderBarn,
                barnId: gjelderBarnId,
            });
        }
    };

    const deleteAndSave = (payload: SletteSamvaersperiodeElementDto) => {
        deleteSamværFn.mutation.mutate(payload, {
            onSuccess: (response) => {
                // Set datoTom til null ellers resettes den ikke
                perioder.replace(
                    response.samværBarn
                        .find((s) => s.gjelderBarn === gjelderBarn)
                        .perioder.map((d) => createSamværsperiodeInitialValues(d)),
                );

                if (!vurderSeparat) {
                    samværBarn.barn
                        .filter((barn) => barn.id !== gjelderBarnId)
                        .forEach((barn) => {
                            setValue(
                                `${barn.id}.perioder`,
                                response.samværBarn
                                    .find((s) => s.barn.id === barn.barn.id)
                                    .perioder.map((d) => createSamværsperiodeInitialValues(d)),
                            );
                        });
                }
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => deleteAndSave(payload),
                    rollbackFn: () => {
                        setValue(`${gjelderBarnId}.perioder`, createSamværInitialValues(samvær).perioder);
                    },
                });
            },
        });

        setEditableRow(undefined);
    };

    const updateAndSave = (payload: OppdaterSamvaerDto) => {
        saveSamværFn.mutation.mutate(
            { triggeredBy: "tableUpdate", ...payload },
            {
                onSuccess: (response) => {
                    perioder.replace(
                        response.samværBarn
                            .find((s) => s.barn.id === gjelderBarnId)
                            .perioder.map((d) => createSamværsperiodeInitialValues(d)),
                    );

                    if (!vurderSeparat) {
                        response.samværBarn
                            .filter((barn) => barn.barn.id !== gjelderBarnId)
                            // biome-ignore lint/suspicious/useIterableCallbackReturn: Fix
                            .forEach((barn) =>
                                setValue(
                                    `${barn.barn.id}.perioder`,
                                    barn.perioder.map((d) => createSamværsperiodeInitialValues(d)),
                                ),
                            );
                    }
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => updateAndSave(payload),
                        rollbackFn: () => {
                            const oppdaterPeriode = payload.periode;
                            if (oppdaterPeriode && oppdaterPeriode.id == null) {
                                const samværperioder = getValues(`${gjelderBarnId}.perioder`);
                                perioder.remove(samværperioder.length - 1);
                            } else {
                                setValue(`${gjelderBarn}.perioder`, createSamværInitialValues(samvær).perioder);
                            }
                        },
                    });
                },
            },
        );

        setEditableRow(undefined);
    };
    const findTomdato = (previousPeriode?: SamværPeriodeFormvalues) => {
        if (previousPeriode) {
            const fomDato = findFomdato(previousPeriode);
            if (!fomDato) return previousPeriode.tom;

            return toISODateString(deductDays(new Date(fomDato), 1));
        }
        return null;
    };
    const findFomdato = (previousPeriode?: SamværPeriodeFormvalues) => {
        if (previousPeriode) {
            const fomDato = previousPeriode.tom
                ? toISODateString(addDays(new Date(previousPeriode.tom), 1))
                : toISODateString(addMonthsIgnoreDay(new Date(previousPeriode.fom), 1));

            if (new Date(fomDato) > getStartOfNextMonth() || new Date(fomDato) < new Date(virkningsdato)) {
                return null;
            }
            return fomDato;
        }
        return toISODateString(virkningsdato);
    };

    const updatePreviousPeriodeTom = (
        previousPeriodeIndex: number,
        previousPeriode: SamværPeriodeFormvalues,
        tom: string | null,
    ) => {
        perioder.update(previousPeriodeIndex, { ...previousPeriode, tom });
    };

    const addPeriode = () => {
        if (checkIfAnotherRowIsEdited()) {
            showErrorModal();
        } else {
            const perioderValues = getValues(`${gjelderBarnId}.perioder`);
            const previousPeriode = perioderValues?.[perioderValues.length - 1];

            if (previousPeriode) {
                setPreviousPeriodeTom(previousPeriode.tom);
                updatePreviousPeriodeTom(perioderValues.length - 1, previousPeriode, findTomdato(previousPeriode));
            }
            perioder.append({
                fom: findFomdato(previousPeriode),
                tom: null,
                samværsklasse: previousPeriode?.samværsklasse ?? Samvaersklasse.SAMVAeRSKLASSE0,
                beregning: previousPeriode?.beregning ?? createSamværskalkulatorDefaultvalues(),
            });

            setEditableRow(perioderValues.length);
        }
    };

    const removeAndCleanUpPeriodeAndErrors = (index: number) => {
        clearErrors(`${gjelderBarnId}.perioder.${index}`);
        const perioderValues = getValues(`${gjelderBarn}.perioder`);
        const prevIndex = index - 1;
        const previousPeriode = perioderValues?.[prevIndex];

        if (previousPeriode && index === perioderValues.length - 1) {
            updatePreviousPeriodeTom(prevIndex, previousPeriode, previousPeriodeTom);
        }
        clearErrors(`${gjelderBarn}.perioder.${index}`);
        perioder.remove(index);
        setEditableRow(undefined);
    };

    const onRemovePeriode = (index: number) => {
        if (checkIfAnotherRowIsEdited(index)) {
            showErrorModal();
        } else {
            const periode = getValues(`${gjelderBarnId}.perioder.${index}`);

            if (periode.id) {
                deleteAndSave({
                    sammeForAlle: !vurderSeparat,
                    samværsperiodeId: Number(periode.id),
                    gjelderBarn,
                    gjelderBarnId: gjelderBarnId,
                });
            } else {
                removeAndCleanUpPeriodeAndErrors(index);
            }
        }
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

    const valideringsfeil = samvær?.valideringsfeil;
    return (
        <>
            <Box
                background="neutral-soft"
                className="overflow-hidden grid gap-2 py-2 px-4 w-full"
                id={`${elementIds.seksjon_samvær}_${samværId}`}
            >
                {displayRoleDetails && (
                    <div className="grid grid-cols-[max-content_auto] items-center p-2 bg-[white]">
                        <div>
                            <RolleTag rolleType={RolleTypeAbbreviation.BA} ident={gjelderBarn} />
                        </div>
                        <BodyShort size="small" className="flex items-center gap-4">
                            <PersonNavn bold ident={gjelderBarn} bareFornavn={false}></PersonNavn>
                            <span>{DateToDDMMYYYYString(dateOrNull())}</span>
                        </BodyShort>
                    </div>
                )}
                {!lesemodus && valideringsfeil?.harPeriodiseringsfeil && (
                    <div className="mb-4">
                        <BehandlingAlert variant="warning">
                            <Heading size="xsmall" level="6">
                                {text.alert.feilIPeriodisering}
                            </Heading>
                            {valideringsfeil.hullIPerioder.length > 0 && (
                                <BodyShort size="small">Det er perioder uten samvær.</BodyShort>
                            )}
                            {valideringsfeil.ingenLøpendeSamvær && (
                                <BodyShort size="small">{text.error.ingenLøpendeSamvær}</BodyShort>
                            )}
                            {valideringsfeil.overlappendePerioder.length > 0 && (
                                <BodyShort size="small">{text.error.overlappendeSamværsperioder}</BodyShort>
                            )}
                            {valideringsfeil.manglerSamvær && (
                                <BodyShort size="small">{text.error.manglerSamværsperioder}</BodyShort>
                            )}
                            {valideringsfeil.ugyldigSluttperiode && (
                                <BodyShort size="small">
                                    {text.error.sistePeriodeMåSluttePåOpphørsdato.replace(
                                        "{}",
                                        DateToDDMMYYYYString(
                                            deductDays(dateOrNull(virkningstidspunkt?.opphørsdato), 1),
                                        ),
                                    )}
                                </BodyShort>
                            )}
                        </BehandlingAlert>
                    </div>
                )}
                <div className="grid gap-2 w-full">
                    {controlledFields.length > 0 && (
                        <div
                            className={`${
                                tableUpdatePending ? "relative" : "inherit"
                            } block overflow-x-auto whitespace-nowrap w-full`}
                        >
                            <OverlayLoader loading={tableUpdatePending} />
                            <SamværsperiodeTable
                                onSaveRow={onSaveRow}
                                onEditRow={onEditRow}
                                fieldName={`${gjelderBarnId}.perioder`}
                                onRemovePeriode={onRemovePeriode}
                                controlledFields={controlledFields}
                                editableRowIndex={editableRow}
                            />
                        </div>
                    )}
                    <div className="grid gap-2">
                        {!lesemodus &&
                            (!erVirkningstidspunktNåværendeMånedEllerFramITid || controlledFields.length === 0) && (
                                <Button
                                    variant="tertiary"
                                    type="button"
                                    size="small"
                                    className="w-fit"
                                    onClick={addPeriode}
                                >
                                    {text.label.leggTilPeriode}
                                </Button>
                            )}
                    </div>
                </div>
            </Box>
        </>
    );
};

interface SamværsperiodeTableProps {
    controlledFields: SamværPeriodeFormvalues[];
    editableRowIndex: number;
    fieldName: `${string}.perioder`;
    onSaveRow: (index: number) => void;
    onEditRow: (index: number) => void;
    onRemovePeriode: (index: number) => void;
}

const SamværsperiodeTable: React.FC<SamværsperiodeTableProps> = ({
    editableRowIndex,
    controlledFields,
    fieldName,
    onSaveRow,
    onEditRow,
    onRemovePeriode,
}) => {
    const [isExpanded, setIsExpanded] = useState<{ [index: number]: boolean }>({});

    const isSamværsklasseCalculated = (item: SamværPeriodeFormvalues) => item.beregning.isSaved === true;
    useEffect(() => {
        controlledFields.forEach((item, index) => {
            setIsExpanded((prev) => ({ ...prev, [index]: isSamværsklasseCalculated(item) ? prev[index] : false }));
        });
    }, [controlledFields]);

    return (
        <Table size="small" className="table-auto table bg-[white] w-full">
            <Table.Header>
                <Table.Row className="align-baseline">
                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                        {text.label.fraOgMed}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                        {text.label.tilOgMed}
                    </Table.HeaderCell>
                    <Table.HeaderCell
                        textSize="small"
                        scope="col"
                        align="right"
                        className="w-[350px]"
                    ></Table.HeaderCell>

                    <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[154px]">
                        {text.label.samvær}
                    </Table.HeaderCell>
                    <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                    <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                    <Table.HeaderCell scope="col" className="w-[56px]"></Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {controlledFields.map((item, index) => (
                    <Table.ExpandableRow
                        key={item?.id}
                        className="align-top"
                        onKeyDown={actionOnEnter(() => onSaveRow(index))}
                        togglePlacement="right"
                        open={!isSamværsklasseCalculated(item) ? false : isExpanded[index] === true}
                        onOpenChange={(isOpen) => {
                            setIsExpanded((prev) => ({ ...prev, [index]: isOpen }));
                        }}
                        expansionDisabled={!isSamværsklasseCalculated(item)}
                        content={<SamværskalkulatorForm fieldname={`${fieldName}.${index}`} viewOnly />}
                    >
                        <Table.DataCell textSize="small">
                            <Samværsperiode
                                editableRow={editableRowIndex === index}
                                label={text.label.fraOgMed}
                                fieldName={`${fieldName}.${index}`}
                                field="fom"
                                item={item}
                            />
                        </Table.DataCell>
                        <Table.DataCell textSize="small">
                            <Samværsperiode
                                editableRow={editableRowIndex === index}
                                label={text.label.tilOgMed}
                                fieldName={`${fieldName}.${index}`}
                                field="tom"
                                item={item}
                            />
                        </Table.DataCell>
                        <Table.DataCell textSize="small" align="right">
                            <SamværskalkulatorButton
                                editableRow={editableRowIndex === index}
                                fieldname={`${fieldName}.${index}`}
                            />
                        </Table.DataCell>
                        <Table.DataCell>
                            <SamværsklasseSelector
                                editableRow={editableRowIndex === index}
                                fieldName={`${fieldName}.${index}`}
                                item={item}
                            />
                        </Table.DataCell>
                        <Table.DataCell>
                            <EditOrSaveButton
                                index={index}
                                editableRow={editableRowIndex === index}
                                onEditRow={onEditRow}
                                onSaveRow={onSaveRow}
                            />
                        </Table.DataCell>
                        <Table.DataCell>
                            <DeleteButton index={index} onRemovePeriode={onRemovePeriode} />
                        </Table.DataCell>
                    </Table.ExpandableRow>
                ))}
            </Table.Body>
        </Table>
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

export default () => {
    return (
        <QueryErrorWrapper>
            <SamværForm />
        </QueryErrorWrapper>
    );
};
