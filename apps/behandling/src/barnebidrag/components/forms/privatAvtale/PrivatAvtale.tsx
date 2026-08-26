import {
    type BarnDto,
    type OppdaterePrivatAvtaleBegrunnelseRequest,
    type PrivatAvtaleBarnDtoV2,
    type PrivatAvtaleDtoV3,
    Rolletype,
    Stonadstype,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ObjectUtils, PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { TrashIcon } from "@navikt/aksel-icons";
import { Alert, Box, Button, Heading } from "@navikt/ds-react";
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { ConfirmationModal } from "../../../../common/components/modal/ConfirmationModal";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import Tabs from "../../../../common/components/wrappingtabs/WrappingTabs";
import { default as urlSearchParams } from "../../../../common/constants/behandlingQueryKeys";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { getFirstDayOfMonthAfterEighteenYears } from "../../../../common/helpers/boforholdFormHelpers";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import useFeatureToogle from "../../../../common/hooks/useFeatureToggle";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { usePageTabs } from "../../../../common/hooks/usePageTabs";
import { addMonths, firstDayOfMonth, isAfterDate, isBeforeDate } from "../../../../utils/date-utils";
import { BarnebidragStepper } from "../../../enum/BarnebidragStepper";
import { useOnCreatePrivatAvtale } from "../../../hooks/useOnCreatePrivatAvtale";
import { useOnUpdatePrivatAvtaleBegrunnelse } from "../../../hooks/useOnUpdatePrivatAvtale";
import type { PrivatAvtaleFormValue, PrivatAvtaleFormValues } from "../../../types/privatAvtaleFormValues";
import PersonIdentSak from "../../PersonIdentSak";
import { BegrunnelseSidemeny } from "../BegrunnelseSidemeny";
import { createInitialValues, createPrivatAvtaleInitialValues } from "../helpers/PrivatAvtaleHelpers";
import { PrivatAvtaleAndreBarn } from "./PrivatAvtaleAndreBarn";
import { PrivatAvtalePerioder } from "./PrivatAvtalePerioder";

export const getFomForPrivatAvtale = (stønadstype: Stonadstype, fødselsdato: string) => {
    const fomMin = new Date("2012-01-01");
    if (stønadstype === Stonadstype.BIDRAG18AAR) {
        const firstMonthAfterEighteenBirthday = getFirstDayOfMonthAfterEighteenYears(new Date(fødselsdato));
        return isBeforeDate(firstMonthAfterEighteenBirthday, fomMin) ? fomMin : firstMonthAfterEighteenBirthday;
    }
    const birthMonth = firstDayOfMonth(new Date(fødselsdato));
    return isBeforeDate(birthMonth, fomMin) ? fomMin : birthMonth;
};

export const getTomForPrivatAvtale = (fødselsdato: string, stønadstype: Stonadstype) => {
    const tomMax = new Date();
    const birthMonth = addMonths(firstDayOfMonth(new Date(fødselsdato)), 1);
    const firstMonthAfterEighteenBirthday = getFirstDayOfMonthAfterEighteenYears(new Date(fødselsdato));
    if (stønadstype === Stonadstype.BIDRAG18AAR) {
        // Hvis 18 år så kan tom være fram i tid
        return addMonths(new Date(), 48);
    }
    const tomMaxAdjustertFor18Year = isAfterDate(tomMax, firstMonthAfterEighteenBirthday)
        ? firstMonthAfterEighteenBirthday
        : tomMax;
    return isAfterDate(birthMonth, tomMaxAdjustertFor18Year) ? birthMonth : tomMaxAdjustertFor18Year;
};

export const RemoveButton = ({
    onDelete,
    confirmationDescription,
}: {
    onDelete: () => void;
    confirmationDescription?: string;
}) => {
    const ref = useRef<HTMLDialogElement>(null);
    const onConfirm = () => {
        ref.current?.close();
        onDelete();
    };

    return (
        <>
            <div className="flex items-center justify-end">
                <Button
                    type="button"
                    onClick={() => ref.current?.showModal()}
                    icon={<TrashIcon aria-hidden />}
                    variant="tertiary"
                    size="small"
                />
            </div>
            <ConfirmationModal
                ref={ref}
                closeable
                description={confirmationDescription ?? text.varsel.ønskerDuÅSlettePrivatAvtale}
                heading={<Heading size="small">{text.varsel.ønskerDuÅSlette}</Heading>}
                footer={
                    <>
                        <Button type="button" onClick={onConfirm} size="small">
                            {text.label.jaSlett}
                        </Button>
                        <Button type="button" variant="secondary" size="small" onClick={() => ref.current?.close()}>
                            {text.label.avbryt}
                        </Button>
                    </>
                }
            />
        </>
    );
};

const Main = ({ initialValues }: { initialValues: PrivatAvtaleFormValues }) => {
    const { control } = useFormContext<PrivatAvtaleFormValues>();
    const { onNavigateToTab, activeStep, selectedRoller } = useBehandlingProvider();
    const [searchParams] = useSearchParams();

    const { bidragFlereBarn } = useFeatureToogle();
    const roller = useFieldArray({
        control,
        name: "roller",
    });
    const watchFieldArray = useWatch({ control, name: "roller" });
    const andreBarn = useWatch({ control, name: "andreBarn" });
    const controlledFields = roller.fields.map((field, index) => ({
        ...field,
        ...watchFieldArray?.[index],
        originalIndex: index,
    }));
    const visibleControlledFields = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));

        if (visibleIds.size === 0) {
            return controlledFields;
        }

        const filtered = controlledFields.filter(({ gjelderBarn }) => visibleIds.has(gjelderBarn.id));
        return filtered.length > 0 ? filtered : controlledFields;
    }, [controlledFields, selectedRoller]);

    const defaultTab = useMemo(() => {
        if (searchParams.get(urlSearchParams.tab) === "andrebarn") {
            return "andrebarn";
        }
        const barnId = visibleControlledFields.find(
            ({ gjelderBarn }) => gjelderBarn.id === Number(searchParams.get(urlSearchParams.tab)),
        )?.gjelderBarn?.id;
        return barnId?.toString() ?? visibleControlledFields[0]?.gjelderBarn.id.toString();
    }, [searchParams, visibleControlledFields]);
    const selectedTab = defaultTab.toString();

    const tabsWithAndreBarn = useMemo(() => {
        const tabs = visibleControlledFields.map((rolle) => ({
            id: rolle.gjelderBarn.id.toString(),
            label: rolle.gjelderBarn.ident,
        }));
        if (bidragFlereBarn) {
            tabs.push({
                id: "andrebarn",
                label: text.label.andreBarn,
            });
        }

        return tabs;
    }, [visibleControlledFields, bidragFlereBarn]);

    usePageTabs({
        items: tabsWithAndreBarn,
        mapToTab: (rolle) => ({
            ...rolle,
        }),
        enabled: activeStep === BarnebidragStepper.PRIVAT_AVTALE,
        selectedTabId: selectedTab,
    });
    return (
        <>
            {andreBarn.length > 0 && (
                <Alert variant="info" size="small">
                    Bidragspliktig har barn uten bidragsak/løpende bidrag. De er listet under "Andre barn". Hvis BP har
                    privat avtale for andre barn kan du fylle ut bidragsbeløpene for å se om det slår ut til
                    forholdsmessig fordeling.
                </Alert>
            )}
            <Tabs
                defaultValue={defaultTab}
                value={selectedTab}
                onChange={onNavigateToTab}
                className={`ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm w-full`}
            >
                <Tabs.List>
                    {visibleControlledFields.map(({ gjelderBarn }) => (
                        <Tabs.Tab
                            key={gjelderBarn.id}
                            value={gjelderBarn.id?.toString()}
                            className="[&>*:first-child]:w-max p-2.5"
                            label={
                                <PersonIdentSak
                                    ident={gjelderBarn.ident}
                                    rolle={Rolletype.BA}
                                    stønadstype={gjelderBarn.stønadstype}
                                />
                            }
                        />
                    ))}
                    {bidragFlereBarn && <Tabs.Tab key="andrebarn" value="andrebarn" label="Andre barn" />}
                </Tabs.List>
                {visibleControlledFields.map((item) => {
                    return (
                        <Tabs.Panel
                            key={item.gjelderBarn.id}
                            value={item.gjelderBarn.id?.toString()}
                            className="grid gap-y-4"
                        >
                            <PrivatAvtaleBarn
                                multiple
                                key={item.id}
                                item={item}
                                barnIndex={item.originalIndex}
                                initialValues={initialValues}
                            />
                        </Tabs.Panel>
                    );
                })}
                {bidragFlereBarn && (
                    <Tabs.Panel key={"andrebarn"} value={"andrebarn"} className="grid gap-y-4">
                        <PrivatAvtaleAndreBarn initialValues={initialValues} />
                    </Tabs.Panel>
                )}
            </Tabs>
        </>
    );
};

const PrivatAvtaleBarn = ({
    multiple,
    item,
    barnIndex,
    initialValues,
}: {
    multiple: boolean;
    item: PrivatAvtaleFormValue;
    barnIndex: number;
    initialValues: PrivatAvtaleFormValues;
}) => {
    const { lesemodus, setSaveErrorState } = useBehandlingProvider();
    const createPrivatAvtale = useOnCreatePrivatAvtale();
    const { setValue } = useFormContext<PrivatAvtaleFormValues>();
    const refetchFFInfo = useRefetchFFInfoFn();

    const onCreatePrivatAvtale = () => {
        const payload: BarnDto = {
            personident: item.gjelderBarn.ident,
            navn: item.gjelderBarn.navn,
            fødselsdato: item.gjelderBarn.fødselsdato,
            stønadstype: item.gjelderBarn.stønadstype,
        };

        createPrivatAvtale.mutation.mutate(payload, {
            onSuccess: (response) => {
                const createdPrivatAvtale = response.privatAvtale.søknadsbarn.find(
                    (rolle) =>
                        rolle.gjelderBarn.ident === payload.personident &&
                        rolle.gjelderBarn.stønadstype === payload.stønadstype,
                ).privatAvtale;
                setValue(`roller.${barnIndex}.privatAvtale`, createPrivatAvtaleInitialValues(createdPrivatAvtale));
                refetchFFInfo();
            },
            onError: () => {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onCreatePrivatAvtale(),
                });
            },
        });
    };

    return (
        <Box background="neutral-soft" className="overflow-hidden grid gap-2 py-2 px-4">
            {!multiple && (
                <div
                    className={`grid grid-cols-[max-content_max-content_auto] p-2 bg-[white] border-0 border-[var(--ax-border-neutral)]`}
                >
                    <div>
                        <RolleTag rolleType={RolleTypeAbbreviation.BA} ident={item.gjelderBarn.ident} />
                    </div>
                    <div className="flex items-center gap-4">
                        <PersonNavnIdent
                            navn={item.gjelderBarn.navn}
                            ident={item.gjelderBarn.ident}
                            fødselsdato={item.gjelderBarn.fødselsdato}
                            visAlder
                            stønad18År={item.gjelderBarn.stønadstype === Stonadstype.BIDRAG18AAR}
                        />
                    </div>
                </div>
            )}
            {!item.privatAvtale?.avtaleId && (
                <Button
                    type="button"
                    onClick={onCreatePrivatAvtale}
                    variant="tertiary"
                    size="small"
                    className="w-fit"
                    disabled={lesemodus}
                >
                    {text.label.opprettePrivatAvtale}
                </Button>
            )}
            {item.privatAvtale?.avtaleId && (
                <PrivatAvtalePerioder prefix="roller" item={item} barnIndex={barnIndex} initialValues={initialValues} />
            )}
        </Box>
    );
};

const Side = () => {
    const [searchParams] = useSearchParams();
    const { erBisysVedtak, privatAvtaleV3, vedtakstype } = useGetBehandlingV2();
    const { onStepChange, getNextStep, setSaveErrorState, selectedRoller } = useBehandlingProvider();
    const updatePrivatAvtaleBegrunnelseMutation = useOnUpdatePrivatAvtaleBegrunnelse();
    const { getValues, watch } = useFormContext<PrivatAvtaleFormValues>();
    const tabBarnIdent = searchParams.get(urlSearchParams.tab);
    const privatAvtaleRoller = getValues("roller").map((rolle, index) => ({
        ...rolle,
        originalIndex: index,
    }));
    const visibleRoller = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));

        if (visibleIds.size === 0) {
            return privatAvtaleRoller;
        }

        const filtered = privatAvtaleRoller.filter((rolle) => visibleIds.has(rolle.gjelderBarn.id));
        return filtered.length > 0 ? filtered : privatAvtaleRoller;
    }, [privatAvtaleRoller, selectedRoller]);
    const valgtRolle =
        tabBarnIdent === "andrebarn"
            ? undefined
            : (visibleRoller.find((rolle) => rolle?.gjelderBarn?.id?.toString() === tabBarnIdent) ?? visibleRoller[0]);
    const rolleIndex = valgtRolle?.originalIndex ?? 0;
    const rolle = valgtRolle;
    const selectedBarnId = rolle?.gjelderBarn?.id;
    const selectedPrivatAvtale = privatAvtaleV3.søknadsbarn.find((avtale) => avtale.gjelderBarn.id === selectedBarnId);
    const begrunnelseFraOpprinneligVedtak = selectedPrivatAvtale?.begrunnelseFraOpprinneligVedtak;
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const begrunnelseName =
        tabBarnIdent === "andrebarn" ? "andreBarnBegrunnelse" : (`roller.${rolleIndex}.begrunnelse` as const);
    const prevValue = useRef(getValues(begrunnelseName));
    const fieldMutationState = useFieldMutationStatus(updatePrivatAvtaleBegrunnelseMutation.mutation, begrunnelseName);

    const updatePrivatAvtaleBegrunnelse = useCallback(
        async (fieldName: string, payload: OppdaterePrivatAvtaleBegrunnelseRequest) => {
            try {
                await updatePrivatAvtaleBegrunnelseMutation.mutation.mutateAsync({
                    triggeredBy: fieldName,
                    ...payload,
                });
            } catch {
                setSaveErrorState({
                    error: true,
                    retryFn: () => updatePrivatAvtaleBegrunnelse(fieldName, payload),
                });
            }
        },
        [updatePrivatAvtaleBegrunnelseMutation, setSaveErrorState],
    );

    const debouncedOnSave = useDebounce(updatePrivatAvtaleBegrunnelse);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name?.includes(begrunnelseName) && type === "change") {
                const begrunnelseValue = name?.includes("begrunnelse")
                    ? value.roller[rolleIndex]?.begrunnelse
                    : value.andreBarnBegrunnelse;

                if (begrunnelseValue !== undefined && begrunnelseValue !== prevValue.current) {
                    prevValue.current = begrunnelseValue;
                    const payload: OppdaterePrivatAvtaleBegrunnelseRequest = {
                        barnIdent: tabBarnIdent === "andrebarn" ? null : rolle?.gjelderBarn?.ident,
                        barnId: tabBarnIdent === "andrebarn" ? null : selectedBarnId,
                        begrunnelse: begrunnelseValue,
                    };
                    debouncedOnSave(name, payload);
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, tabBarnIdent, selectedBarnId, begrunnelseName, debouncedOnSave, prevValue]);

    return (
        <Fragment key={tabBarnIdent}>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <BegrunnelseSidemeny
                    name={begrunnelseName}
                    label={text.title.begrunnelse}
                    mutationState={fieldMutationState}
                    resize
                />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && begrunnelseFraOpprinneligVedtak && (
                <CustomTextareaEditor
                    name={`${begrunnelseName}.begrunnelseFraOpprinneligVedtak`}
                    label={text.label.begrunnelseFraOpprinneligVedtak}
                    value={begrunnelseFraOpprinneligVedtak}
                    resize
                    readOnly
                />
            )}
            <ActionButtons onNext={() => onStepChange(getNextStep(BarnebidragStepper.PRIVAT_AVTALE))} />
        </Fragment>
    );
};

const PrivatAvtaleForm = () => {
    const { setPageErrorsOrUnsavedState } = useBehandlingProvider();
    const { privatAvtaleV3: privatAvtale } = useGetBehandlingV2();
    const privatAvtaleRef = useRef<PrivatAvtaleDtoV3>(privatAvtale);
    const initialValues = useMemo(() => createInitialValues(privatAvtaleRef.current), [privatAvtaleRef]);
    const useFormMethods = useForm({
        defaultValues: initialValues,
    });

    const {
        setError,
        reset,
        formState: { errors },
    } = useFormMethods;

    useEffect(() => {
        const checkForBegrunnelseValidationError = (avtale: PrivatAvtaleBarnDtoV2) =>
            avtale?.valideringsfeil?.manglerBegrunnelse;

        const setBegrunnelseError = (fieldname: `roller.${number}.begrunnelse` | "andreBarnBegrunnelse") => {
            setError(fieldname, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        };

        privatAvtale.søknadsbarn.forEach((avtale, index) => {
            if (checkForBegrunnelseValidationError(avtale.privatAvtale)) {
                setBegrunnelseError(`roller.${index}.begrunnelse`);
            }
        });
        if (privatAvtale.andreBarn.manglerBegrunnelse) {
            setBegrunnelseError("andreBarnBegrunnelse");
        }
    }, []);

    useEffect(() => {
        reset(initialValues);
    }, [initialValues]);

    useEffect(() => {
        setPageErrorsOrUnsavedState((prevState) => ({
            ...prevState,
            privatAvtale: {
                error: !ObjectUtils.isEmpty(errors),
            },
        }));
    }, [errors]);

    return (
        <FormProvider {...useFormMethods}>
            <form onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout
                    title={text.label.privatAvtale}
                    main={<Main initialValues={initialValues} />}
                    side={<Side />}
                />
            </form>
        </FormProvider>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <PrivatAvtaleForm />
        </QueryErrorWrapper>
    );
};
