import {
    type OppdatereInntektBegrunnelseRequest,
    Rolletype,
    Stonadstype,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Heading, Tabs } from "@navikt/ds-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { BehandlingAlert } from "../../../../common/components/BehandlingAlert";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { InntektHeader } from "../../../../common/components/inntekt/InntektHeader";
import { InntektTableComponent, InntektTableProvider } from "../../../../common/components/inntekt/InntektTableContext";
import { NyOpplysningerAlert } from "../../../../common/components/inntekt/NyOpplysningerAlert";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import {
    INNTEKT_BEGRUNNELSE_MAL_BIDRAG,
    INNTEKT_BEGRUNNELSE_MAL_BM_BIDRAG,
} from "../../../../common/constants/ begrunnelseTemplate";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { createInitialValues, inntekterTablesViewRules } from "../../../../common/helpers/inntektFormHelpers";
import { useActiveInntektTab } from "../../../../common/hooks/useActiveInntektTab";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useOnSaveInntektBegrunnelse } from "../../../../common/hooks/useOnSaveInntektBegrunnelse";
import { usePageTabs } from "../../../../common/hooks/usePageTabs";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import type { InntektFormValues } from "../../../../common/types/inntektFormValues";
import { BarnebidragStepper } from "../../../enum/BarnebidragStepper";
import PersonIdentSak from "../../PersonIdentSak";
import { BegrunnelseSidemeny } from "../BegrunnelseSidemeny";

const Main = () => {
    const { type } = useGetBehandlingV2();
    const { beregnetGebyrErEndret, lesemodus, onNavigateToTab, activeStep, selectedRoller } = useBehandlingProvider();
    const { inntekterV2: inntektRoller } = useGetBehandlingV2();
    const visibleInntektRoller = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));
        if (visibleIds.size === 0) {
            return inntektRoller;
        }
        const filtered = inntektRoller.filter((inntektRolle) => visibleIds.has(inntektRolle.gjelder.id));
        return filtered.length > 0 ? filtered : inntektRoller;
    }, [inntektRoller, selectedRoller]);

    const { selectedTab, defaultTab } = useActiveInntektTab(visibleInntektRoller);

    usePageTabs({
        items: visibleInntektRoller,
        mapToTab: (rolle) => ({
            id: rolle.gjelder.id.toString(),
            label: rolle.gjelder.rolletype,
        }),
        enabled: activeStep === BarnebidragStepper.INNTEKT,
        selectedTabId: selectedTab,
    });
    return (
        <>
            {beregnetGebyrErEndret && !lesemodus && (
                <BehandlingAlert variant="info" className="mb-4">
                    <Heading size="xsmall" level="6">
                        {text.alert.gebyrHarBlittEndret}
                    </Heading>
                    <BodyShort size="small">{text.alert.gebyrHarBlittEndretDescription}</BodyShort>
                </BehandlingAlert>
            )}
            <Tabs
                defaultValue={defaultTab}
                value={selectedTab}
                onChange={onNavigateToTab}
                className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-[720px] ax-sm:max-w-[598px]"
            >
                <Tabs.List>
                    {visibleInntektRoller.map((inntektRolle) => (
                        <Tabs.Tab
                            key={inntektRolle.gjelder.id}
                            value={inntektRolle.gjelder.id.toString()}
                            className="[&>*:first-child]:w-max p-2.5"
                            label={
                                <PersonIdentSak
                                    ident={inntektRolle.gjelder.ident}
                                    rolle={inntektRolle.gjelder.rolletype}
                                    stønadstype={inntektRolle.gjelder.stønadstype}
                                />
                            }
                        />
                    ))}
                </Tabs.List>
                {visibleInntektRoller.map((inntektRolle) => {
                    return (
                        <InntektTableProvider key={inntektRolle.gjelder.id} rolle={inntektRolle.gjelder} type={type}>
                            <Tabs.Panel
                                value={inntektRolle.gjelder.id.toString()}
                                className="grid gap-y-4 ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm"
                            >
                                <div className="mt-4">
                                    <InntektHeader ident={inntektRolle.gjelder.ident} />
                                </div>
                                {inntekterTablesViewRules[type][inntektRolle.gjelder.rolletype].map(
                                    (tableType, index: number) => (
                                        <Fragment key={tableType + index}>
                                            {InntektTableComponent[tableType]()}
                                        </Fragment>
                                    ),
                                )}
                            </Tabs.Panel>
                        </InntektTableProvider>
                    );
                })}
            </Tabs>
        </>
    );
};

const Side = () => {
    const { onStepChange, setSaveErrorState, getNextStep, selectedRoller } = useBehandlingProvider();
    const { erBisysVedtak, inntekterV2: inntektRoller, vedtakstype } = useGetBehandlingV2();
    const saveInntektBegrunnelse = useOnSaveInntektBegrunnelse();
    const { watch, getValues, setValue } = useFormContext<InntektFormValues>();
    const visibleInntektRoller = useMemo(() => {
        const visibleIds = new Set(selectedRoller.map((rolle) => rolle.id));
        if (visibleIds.size === 0) {
            return inntektRoller;
        }
        const filtered = inntektRoller.filter((inntektRolle) => visibleIds.has(inntektRolle.gjelder.id));
        return filtered.length > 0 ? filtered : inntektRoller;
    }, [inntektRoller, selectedRoller]);

    const { selectedRolle: selectedInntektRolle } = useActiveInntektTab(visibleInntektRoller);
    const selectedRolleId = selectedInntektRolle?.gjelder?.id;
    const [previousValues, setPreviousValues] = useState<string>(getValues(`begrunnelser.${selectedRolleId}`));
    const begrunnelseFraOpprinneligVedtak = selectedInntektRolle.inntekter.begrunnelseFraOpprinneligVedtak;
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;

    const onSave = useCallback(
        async (payload: OppdatereInntektBegrunnelseRequest) => {
            try {
                const response = await saveInntektBegrunnelse.mutation.mutateAsync(payload);
                setPreviousValues(response.oppdatertBegrunnelse.nyBegrunnelse);
            } catch {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onSave(payload),
                    rollbackFn: () =>
                        setValue(`begrunnelser.${payload.oppdatereBegrunnelse.rolleid}`, previousValues ?? ""),
                });
            }
        },
        [saveInntektBegrunnelse, previousValues, setPreviousValues, setValue, setSaveErrorState],
    );

    const debouncedOnSave: (payload: OppdatereInntektBegrunnelseRequest) => void = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name?.includes("begrunnelser") && type === "change") {
                const begrunnelse = value.begrunnelser[selectedRolleId];
                const payload = {
                    oppdatereBegrunnelse: {
                        nyBegrunnelse: begrunnelse,
                        rolleid: Number(selectedRolleId),
                    },
                };
                debouncedOnSave(payload);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, selectedRolleId, debouncedOnSave]);

    const descriptionText =
        selectedInntektRolle.gjelder.rolletype === Rolletype.BM
            ? text.description.inntektBegrunnelseBM
            : selectedInntektRolle.gjelder.rolletype === Rolletype.BP
              ? text.description.inntektBegrunnelseBP
              : undefined;

    function getPrefilledTemplate() {
        if (selectedInntektRolle.gjelder.stønadstype === Stonadstype.BIDRAG18AAR) {
            switch (selectedInntektRolle.gjelder.rolletype) {
                case Rolletype.BP:
                    return INNTEKT_BEGRUNNELSE_MAL_BIDRAG;
                case Rolletype.BM:
                    return INNTEKT_BEGRUNNELSE_MAL_BIDRAG;
                default:
                    return undefined;
            }
        } else {
            switch (selectedInntektRolle.gjelder.rolletype) {
                case Rolletype.BP:
                    return INNTEKT_BEGRUNNELSE_MAL_BIDRAG;
                case Rolletype.BM:
                    return INNTEKT_BEGRUNNELSE_MAL_BM_BIDRAG;
                default:
                    return undefined;
            }
        }
    }

    return (
        <Fragment key={selectedRolleId}>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <BegrunnelseSidemeny
                    description={descriptionText}
                    label={text.title.begrunnelse}
                    prefilledHtml={getPrefilledTemplate()}
                    name={`begrunnelser.${selectedRolleId}`}
                    mutationState={saveInntektBegrunnelse.mutation.status}
                    resize
                />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && begrunnelseFraOpprinneligVedtak?.innhold && (
                <CustomTextareaEditor
                    name="begrunnelseFraOpprinneligVedtak"
                    label={text.label.begrunnelseFraOpprinneligVedtak}
                    value={begrunnelseFraOpprinneligVedtak.innhold}
                    resize
                    readOnly
                />
            )}
            <ActionButtons onNext={() => onStepChange(getNextStep(BarnebidragStepper.INNTEKT))} />
        </Fragment>
    );
};

const InntektForm = () => {
    const { erBisysVedtak, inntekterV2: inntektRoller } = useGetBehandlingV2();
    const virkningsdato = useVirkningsdato();
    const initialValues = useMemo(() => {
        return createInitialValues(inntektRoller, virkningsdato);
    }, [inntektRoller, virkningsdato, erBisysVedtak]);
    const useFormMethods = useForm({
        defaultValues: initialValues,
    });

    return (
        <FormProvider {...useFormMethods}>
            <form onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout title="Inntekt" main={<Main />} side={<Side />} pageAlert={<NyOpplysningerAlert />} />
            </form>
        </FormProvider>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <InntektForm />
        </QueryErrorWrapper>
    );
};
