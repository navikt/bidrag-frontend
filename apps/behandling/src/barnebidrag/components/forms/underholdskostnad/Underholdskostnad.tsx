import {
    type OppdatereBegrunnelseRequest,
    Rolletype,
    type UnderholdDto,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ModiaLink, RolleTypeAbbreviation } from "@bidrag/common";
import { BodyShort, Tabs } from "@navikt/ds-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import { toUnderholdskostnadTabQueryParameter } from "../../../../common/constants/behandlingQueryKeys";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { usePageTabs } from "../../../../common/hooks/usePageTabs";

import { BarnebidragStepper } from "../../../enum/BarnebidragStepper";
import { useGetActiveAndDefaultUnderholdskostnadTab } from "../../../hooks/useGetActiveAndDefaultUnderholdskostnadTab";
import { useOnUpdateUnderholdBegrunnelse } from "../../../hooks/useOnUpdateUnderhold";
import type { UnderholdskostnadFormValues } from "../../../types/underholdskostnadFormValues";
import PersonIdentSak from "../../PersonIdentSak";
import { BegrunnelseSidemeny } from "../BegrunnelseSidemeny";
import { createInitialValues } from "../helpers/UnderholdskostnadFormHelpers";
import { AndreBarn } from "./AndreBarn";
import { Barnetilsyn } from "./Barnetilsyn";
import { NyOpplysningerAlert } from "./BarnetilsynOpplysninger";

const Main = () => {
    const { roller } = useGetBehandlingV2();
    const { onNavigateToTab, activeStep, selectedRoller } = useBehandlingProvider();
    const { getValues } = useFormContext<UnderholdskostnadFormValues>();
    const søknadsBarnUnderholdskostnader = getValues("underholdskostnaderMedIBehandling");
    const visibleSøknadsBarnUnderholdskostnader = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));
        if (visibleIds.size === 0) {
            return søknadsBarnUnderholdskostnader;
        }
        const filtered = søknadsBarnUnderholdskostnader.filter((underhold) => visibleIds.has(underhold.gjelderBarn.id));
        return filtered.length > 0 ? filtered : søknadsBarnUnderholdskostnader;
    }, [selectedRoller, søknadsBarnUnderholdskostnader]);
    const [activeTab, defaultTab] = useGetActiveAndDefaultUnderholdskostnadTab(visibleSøknadsBarnUnderholdskostnader);
    const BMRolle = roller.find((rolle) => rolle.rolletype === Rolletype.BM);

    const tabsWithAndreBarn = useMemo(() => {
        const tabs = visibleSøknadsBarnUnderholdskostnader.map((rolle) => ({
            id: toUnderholdskostnadTabQueryParameter(rolle.gjelderBarn.id, rolle.id, true),
            label: rolle.gjelderBarn.ident,
        }));
        tabs.push({
            id: "underholdskostnaderAndreBarn",
            label: text.label.andreBarn,
        });
        return tabs;
    }, [visibleSøknadsBarnUnderholdskostnader]);
    const shouldEnableTabs =
        visibleSøknadsBarnUnderholdskostnader.length > 1 && activeStep === BarnebidragStepper.UNDERHOLDSKOSTNAD;

    usePageTabs({
        items: tabsWithAndreBarn,
        mapToTab: (tab) => tab,
        selectedTabId: activeTab,
        enabled: shouldEnableTabs,
    });

    return (
        <>
            {BMRolle.harInnvilgetTilleggsstønad && (
                <BehandlingAlert variant="info">
                    <div className="inline-flex gap-2 items-center">
                        <BodyShort size="small">{text.alert.harInnvilgetTilleggsstønad}</BodyShort>
                        <ModiaLink ident={BMRolle.ident} />
                    </div>
                </BehandlingAlert>
            )}
            <Tabs
                defaultValue={defaultTab}
                value={activeTab}
                onChange={onNavigateToTab}
                className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm"
            >
                <Tabs.List>
                    {visibleSøknadsBarnUnderholdskostnader.map((underhold) => (
                        <Tabs.Tab
                            key={`tab-${underhold.gjelderBarn.id}`}
                            value={toUnderholdskostnadTabQueryParameter(underhold.gjelderBarn.id, underhold.id, true)}
                            className="[&>*:first-child]:w-max p-2.5"
                            label={
                                <PersonIdentSak
                                    ident={underhold.gjelderBarn.ident}
                                    rolle={Rolletype.BA}
                                    stønadstype={underhold.gjelderBarn.stønadstype}
                                />
                            }
                        />
                    ))}
                    <Tabs.Tab
                        key="underholdskostnaderAndreBarn"
                        value="underholdskostnaderAndreBarn"
                        label={text.label.andreBarn}
                    />
                </Tabs.List>
                {visibleSøknadsBarnUnderholdskostnader.map((underhold, index) => {
                    return (
                        <Tabs.Panel
                            key={`underholdskostnadTabPanel-${underhold.gjelderBarn.id}`}
                            value={toUnderholdskostnadTabQueryParameter(underhold.gjelderBarn.id, underhold.id, true)}
                        >
                            <Barnetilsyn index={index} />
                        </Tabs.Panel>
                    );
                })}
                <Tabs.Panel value="underholdskostnaderAndreBarn" className="grid gap-y-4 py-4">
                    <AndreBarn visibleBarnIds={selectedRoller.map((rolle) => rolle.id)} />
                </Tabs.Panel>
            </Tabs>
        </>
    );
};

const Side = () => {
    const { lesemodus, onStepChange, getNextStep, setSaveErrorState } = useBehandlingProvider();
    const { erBisysVedtak, underholdskostnader, vedtakstype } = useGetBehandlingV2();
    const { watch, getValues, setValue, setError } = useFormContext<UnderholdskostnadFormValues>();
    const { selectedRoller } = useBehandlingProvider();
    const visibleUnderholdskostnader = useMemo(() => {
        const currentUnderholdskostnader = getValues("underholdskostnaderMedIBehandling");
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));
        if (visibleIds.size === 0) {
            return currentUnderholdskostnader;
        }
        const filtered = currentUnderholdskostnader.filter((underhold) => visibleIds.has(underhold.gjelderBarn.id));
        return filtered.length > 0 ? filtered : currentUnderholdskostnader;
    }, [getValues, selectedRoller]);
    const [activeTab] = useGetActiveAndDefaultUnderholdskostnadTab(
        visibleUnderholdskostnader as { id: number; gjelderBarn: { id: number } }[],
    );
    const [field, _, underholdskostnadId] = activeTab.split("-");
    const tabIsAndreBarn = field === "underholdskostnaderAndreBarn";
    const currentBM = selectedRoller.find((rolle) => rolle.rolleType === RolleTypeAbbreviation.BM);
    const underholdskostnaderAndreBarnForCurrentBM = useMemo(() => {
        const andreBarn = getValues("underholdskostnaderAndreBarn") ?? [];
        if (currentBM == null) {
            return andreBarn;
        }

        return andreBarn.filter((underhold) => underhold.gjelderBarn.bidragsmottakerId === currentBM.id);
    }, [currentBM, getValues, selectedRoller]);
    const underholdId = tabIsAndreBarn ? underholdskostnaderAndreBarnForCurrentBM[0]?.id : underholdskostnadId;
    const fieldIndex = tabIsAndreBarn
        ? 0
        : getValues("underholdskostnaderMedIBehandling").findIndex((underhold) => underhold.id === Number(underholdId));

    const saveUnderhold = useOnUpdateUnderholdBegrunnelse();
    const fieldName = tabIsAndreBarn
        ? "underholdskostnaderAndreBarnBegrunnelse"
        : (`${field as "underholdskostnaderMedIBehandling"}.${fieldIndex}.begrunnelse` as const);
    const [previousValue, setPreviousValue] = useState<string>(getValues(fieldName));
    const begrunnelseFraOpprinneligVedtak = underholdskostnader.find(
        (underhold) => underhold.id === Number(underholdId),
    )?.begrunnelseFraOpprinneligVedtak;
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const mutationState = useFieldMutationStatus(saveUnderhold.mutation, fieldName);

    useEffect(() => {
        if (!tabIsAndreBarn) {
            return;
        }

        const begrunnelseForCurrentBM = underholdskostnaderAndreBarnForCurrentBM[0]?.begrunnelse ?? "";
        if (getValues("underholdskostnaderAndreBarnBegrunnelse") !== begrunnelseForCurrentBM) {
            setValue("underholdskostnaderAndreBarnBegrunnelse", begrunnelseForCurrentBM, {
                shouldDirty: false,
                shouldTouch: false,
                shouldValidate: false,
            });
        }
    }, [tabIsAndreBarn, underholdskostnaderAndreBarnForCurrentBM, getValues, setValue]);

    useEffect(() => {
        const currentUnderhold = underholdskostnader.find((u) => u.id === Number(underholdId));

        if (currentUnderhold?.valideringsfeil?.manglerBegrunnelse) {
            setError(fieldName, {
                type: "notValid",
                message: text.error.feltErPåkrevd,
            });
        }
    }, [fieldName, underholdId]);

    const onSave = useCallback(
        async (name: string, payload: OppdatereBegrunnelseRequest) => {
            try {
                await saveUnderhold.mutation.mutateAsync({ triggeredBy: fieldName, ...payload });
                setPreviousValue(payload.begrunnelse);
            } catch {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onSave(name, payload),
                    rollbackFn: () => {
                        setValue(fieldName, previousValue ?? "");
                    },
                });
            }
        },
        [fieldName, previousValue, saveUnderhold, setPreviousValue, setSaveErrorState, setValue],
    );

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name?.includes(fieldName) && type === "change") {
                if (tabIsAndreBarn && value.underholdskostnaderAndreBarn.length === 0) {
                    return;
                }
                const begrunnelse = tabIsAndreBarn
                    ? value.underholdskostnaderAndreBarnBegrunnelse
                    : value.underholdskostnaderMedIBehandling[fieldIndex].begrunnelse;

                if (tabIsAndreBarn) {
                    const currentAndreBarn = getValues("underholdskostnaderAndreBarn") ?? [];
                    const updatedAndreBarn = currentAndreBarn.map((underhold) => {
                        const belongsToCurrentBM =
                            currentBM == null || underhold.gjelderBarn.bidragsmottakerId === currentBM.id;
                        if (!belongsToCurrentBM || underhold.begrunnelse === begrunnelse) {
                            return underhold;
                        }

                        return {
                            ...underhold,
                            begrunnelse,
                        };
                    });

                    setValue("underholdskostnaderAndreBarn", updatedAndreBarn, {
                        shouldDirty: false,
                        shouldTouch: false,
                        shouldValidate: false,
                    });
                }

                const payload: OppdatereBegrunnelseRequest = {
                    begrunnelse,
                    bidragsmottakerId: currentBM?.id,
                    underholdsid: tabIsAndreBarn ? null : Number(underholdId),
                };
                debouncedOnSave(name, payload);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, fieldName, tabIsAndreBarn, underholdId, fieldIndex, currentBM, debouncedOnSave, getValues, setValue]);

    return (
        <Fragment key={activeTab}>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && underholdId && (
                <BegrunnelseSidemeny
                    key={fieldName}
                    name={fieldName}
                    label={text.title.begrunnelse}
                    readOnly={lesemodus}
                    mutationState={mutationState}
                    required
                    resize
                />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && !underholdId && (
                <BegrunnelseSidemeny name="begrunnelse" label={text.title.begrunnelse} readOnly resize />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && begrunnelseFraOpprinneligVedtak && (
                <CustomTextareaEditor
                    key={fieldName}
                    name="begrunnelseFraOpprinneligVedtak"
                    label={text.label.begrunnelseFraOpprinneligVedtak}
                    value={begrunnelseFraOpprinneligVedtak}
                    resize
                    readOnly
                />
            )}
            <ActionButtons onNext={() => onStepChange(getNextStep(BarnebidragStepper.UNDERHOLDSKOSTNAD))} />
        </Fragment>
    );
};

const UnderholdskostnadForm = () => {
    const { underholdskostnader } = useGetBehandlingV2();
    const underholdskostnaderRef = useRef<UnderholdDto[]>(underholdskostnader);
    const initialValues = useMemo(() => createInitialValues(underholdskostnaderRef.current), [underholdskostnaderRef]);
    const useFormMethods = useForm({
        defaultValues: initialValues,
        mode: "onChange",
    });

    return (
        <FormProvider {...useFormMethods}>
            <form onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout
                    title={text.title.underholdskostnad}
                    main={<Main />}
                    side={<Side />}
                    pageAlert={<NyOpplysningerAlert />}
                />
            </form>
        </FormProvider>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <UnderholdskostnadForm />
        </QueryErrorWrapper>
    );
};
