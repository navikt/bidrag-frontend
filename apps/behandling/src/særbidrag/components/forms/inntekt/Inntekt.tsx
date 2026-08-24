import { type OppdatereInntektBegrunnelseRequest, Rolletype, Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, type RolleType } from "@bidrag/common";
import { Tabs } from "@navikt/ds-react";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { FormControlledCustomTextareaEditor } from "../../../../common/components/formFields/FormControlledCustomTextEditor";
import { InntektHeader } from "../../../../common/components/inntekt/InntektHeader";
import { InntektTableComponent, InntektTableProvider } from "../../../../common/components/inntekt/InntektTableContext";
import { NyOpplysningerAlert } from "../../../../common/components/inntekt/NyOpplysningerAlert";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import { INNTEKT_BEGRUNNELSE_MAL_SÆRBIDRAG } from "../../../../common/constants/ begrunnelseTemplate";
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
import { scrollToHash } from "../../../../utils/window-utils";

import { SærligeutgifterStepper } from "../../../enum/SærligeutgifterStepper";

const Main = () => {
    const { type, inntekterV2: inntektRoller } = useGetBehandlingV2();
    const { onNavigateToTab } = useBehandlingProvider();

    const { selectedTab, defaultTab } = useActiveInntektTab(inntektRoller);

    useEffect(scrollToHash, []);

    usePageTabs({
        items: inntektRoller,
        mapToTab: (inntektRolle) => ({
            id: inntektRolle.gjelder.id.toString(),
            label: inntektRolle.gjelder.rolletype,
        }),
        selectedTabId: selectedTab,
    });
    return (
        <Tabs
            defaultValue={defaultTab}
            value={selectedTab}
            onChange={onNavigateToTab}
            className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm"
        >
            <Tabs.List>
                {inntektRoller.map((inntektRolle) => (
                    <Tabs.Tab
                        key={inntektRolle.gjelder.id}
                        value={inntektRolle.gjelder.id.toString()}
                        className="[&>*:first-child]:w-max p-2.5"
                        label={
                            <PersonNavnIdent
                                ident={inntektRolle.gjelder.ident}
                                rolle={inntektRolle.gjelder.rolletype as unknown as RolleType}
                                variant="navnIdent"
                                bareFornavn
                            />
                        }
                    />
                ))}
            </Tabs.List>
            {inntektRoller.map((inntektRolle) => {
                return (
                    <InntektTableProvider key={inntektRolle.gjelder.id} rolle={inntektRolle.gjelder} type={type}>
                        <Tabs.Panel
                            key={inntektRolle.gjelder.ident}
                            value={inntektRolle.gjelder.id.toString()}
                            className="grid gap-y-4"
                        >
                            <div className="mt-4">
                                <InntektHeader ident={inntektRolle.gjelder.ident} />
                            </div>
                            {inntekterTablesViewRules[type][inntektRolle.gjelder.rolletype].map((tableType) => (
                                <Fragment key={inntektRolle.gjelder.ident + tableType}>
                                    {InntektTableComponent[tableType]()}
                                </Fragment>
                            ))}
                        </Tabs.Panel>
                    </InntektTableProvider>
                );
            })}
        </Tabs>
    );
};

const Side = () => {
    const { erBisysVedtak, vedtakstype, inntekterV2: inntektRoller } = useGetBehandlingV2();
    const { onStepChange, setSaveErrorState, getNextStep } = useBehandlingProvider();
    const saveInntektBegrunnelse = useOnSaveInntektBegrunnelse();
    const { watch, getValues, setValue } = useFormContext<InntektFormValues>();
    const { selectedRolle } = useActiveInntektTab(inntektRoller);
    const selectedRolleId = selectedRolle?.gjelder?.id;
    const [previousValues, setPreviousValues] = useState<string>(
        () => getValues(`begrunnelser.${selectedRolleId}`) ?? "",
    );

    useEffect(() => {
        setPreviousValues(getValues(`begrunnelser.${selectedRolleId}`) ?? "");
    }, [selectedRolleId, getValues]);

    const begrunnelseFraOpprinneligVedtak = selectedRolle?.inntekter?.begrunnelseFraOpprinneligVedtak;
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const onSave = useCallback(
        async (payload: OppdatereInntektBegrunnelseRequest) => {
            try {
                const response = await saveInntektBegrunnelse.mutation.mutateAsync({
                    ...payload,
                });
                setPreviousValues(response.oppdatertBegrunnelse.nyBegrunnelse);
            } catch {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onSave(payload),
                    rollbackFn: () => {
                        setValue(`begrunnelser.${selectedRolleId}`, previousValues ?? "");
                    },
                });
            }
        },
        [saveInntektBegrunnelse, setPreviousValues, setValue, previousValues, setSaveErrorState, selectedRolleId],
    );
    const onNext = () => onStepChange(getNextStep(SærligeutgifterStepper.INNTEKT));

    const debouncedOnSave: (payload: OppdatereInntektBegrunnelseRequest) => void = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name.includes("begrunnelser") && type === "change") {
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
    }, [watch, debouncedOnSave, selectedRolleId]);

    const descriptionText =
        selectedRolle.gjelder.rolletype === Rolletype.BM
            ? text.description.inntektBegrunnelseBM
            : selectedRolle.gjelder.rolletype === Rolletype.BP
              ? text.description.inntektBegrunnelseBP
              : undefined;

    function getPrefilledTemplate() {
        switch (selectedRolle.gjelder.rolletype) {
            case Rolletype.BP:
                return INNTEKT_BEGRUNNELSE_MAL_SÆRBIDRAG;
            case Rolletype.BM:
                return INNTEKT_BEGRUNNELSE_MAL_SÆRBIDRAG;
            default:
                return undefined;
        }
    }
    return (
        <Fragment key={selectedRolleId}>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <FormControlledCustomTextareaEditor
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
            <ActionButtons onNext={onNext} />
        </Fragment>
    );
};

const InntektForm = () => {
    const { erBisysVedtak, inntekterV2: inntektRoller } = useGetBehandlingV2();
    const virkningsdato = useVirkningsdato();
    const initialValues = useMemo(
        () => createInitialValues(inntektRoller, virkningsdato),
        [inntektRoller, virkningsdato, erBisysVedtak],
    );
    const useFormMethods = useForm({
        defaultValues: initialValues,
    });

    return (
        <FormProvider {...useFormMethods}>
            <form onSubmit={(e) => e.preventDefault()}>
                <NewFormLayout
                    title={text.title.inntekt}
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
            <InntektForm />
        </QueryErrorWrapper>
    );
};
