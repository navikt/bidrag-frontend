import { type OppdatereInntektBegrunnelseRequest, Rolletype, Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, type RolleType } from "@bidrag/common";
import { Tabs } from "@navikt/ds-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { FormControlledCustomTextareaEditor } from "../../../../common/components/formFields/FormControlledCustomTextEditor";
import { InntektHeader } from "../../../../common/components/inntekt/InntektHeader";
import { InntektTableComponent, InntektTableProvider } from "../../../../common/components/inntekt/InntektTableContext";
import { NyOpplysningerAlert } from "../../../../common/components/inntekt/NyOpplysningerAlert";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { inntekterTablesViewRules } from "../../../../common/helpers/inntektFormHelpers";
import { useActiveInntektTab } from "../../../../common/hooks/useActiveInntektTab";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useOnSaveInntektBegrunnelse } from "../../../../common/hooks/useOnSaveInntektBegrunnelse";
import { usePageTabs } from "../../../../common/hooks/usePageTabs";
import { useVirkningsdato } from "../../../../common/hooks/useVirkningsdato";
import type { InntektFormValues } from "../../../../common/types/inntektFormValues";

import { STEPS } from "../../../constants/steps";
import { ForskuddStepper } from "../../../enum/ForskuddStepper";
import { createInitialForskuddInntektValues } from "../helpers/inntektFormHelpers";

const Main = () => {
    const { type, inntekterV2: inntektRoller } = useGetBehandlingV2();
    const { onNavigateToTab, activeStep } = useBehandlingProvider();
    const { selectedTab, defaultTab } = useActiveInntektTab(inntektRoller);

    usePageTabs({
        items: inntektRoller,
        mapToTab: (inntektRolle) => ({
            id: inntektRolle.gjelder.id.toString(),
            label: inntektRolle.gjelder.rolletype,
        }),
        selectedTabId: selectedTab,
        enabled: activeStep === ForskuddStepper.INNTEKT,
    });
    return (
        <Tabs
            defaultValue={defaultTab}
            value={selectedTab}
            onChange={onNavigateToTab}
            className="ax-lg:max-w-[960px] ax-md:max-w-[720px] ax-sm:max-w-[598px]"
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
                                visAlder={Rolletype.BA === inntektRolle.gjelder.rolletype}
                            />
                        }
                    />
                ))}
            </Tabs.List>
            {inntektRoller.map((inntektRolle) => {
                return (
                    <InntektTableProvider rolle={inntektRolle.gjelder} type={type}>
                        <Tabs.Panel
                            key={inntektRolle.gjelder.id}
                            value={inntektRolle.gjelder.id.toString()}
                            className="grid gap-y-4"
                        >
                            <div className="mt-4">
                                <InntektHeader ident={inntektRolle.gjelder.ident} />
                            </div>
                            {inntekterTablesViewRules[type][inntektRolle.gjelder.rolletype].map((tableType) =>
                                InntektTableComponent[tableType](),
                            )}
                        </Tabs.Panel>
                    </InntektTableProvider>
                );
            })}
        </Tabs>
    );
};

const Side = () => {
    const { onStepChange, setSaveErrorState } = useBehandlingProvider();
    const { erBisysVedtak, vedtakstype, inntekterV2: inntektRoller } = useGetBehandlingV2();
    const selectedRolle = inntektRoller.find((inntektRolle) => inntektRolle.gjelder.rolletype === Rolletype.BM);
    const selectedRolleId = selectedRolle?.gjelder.id.toString();
    const saveInntektBegrunnelse = useOnSaveInntektBegrunnelse();
    const { watch, getValues, setValue } = useFormContext<InntektFormValues>();
    const [previousValues, setPreviousValues] = useState<string>(
        () => getValues(`begrunnelser.${selectedRolleId}`) ?? "",
    );

    const begrunnelseFraOpprinneligVedtak = selectedRolle?.inntekter?.begrunnelseFraOpprinneligVedtak;
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
                    rollbackFn: () => {
                        setValue(`begrunnelser.${selectedRolleId}`, previousValues ?? "");
                    },
                });
            }
        },
        [saveInntektBegrunnelse, setValue, selectedRolleId, previousValues, setSaveErrorState],
    );

    const onNext = () => onStepChange(STEPS[ForskuddStepper.VEDTAK]);

    const debouncedOnSave: (payload: OppdatereInntektBegrunnelseRequest) => void = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name.includes("begrunnelser") && type === "change") {
                const payload = {
                    oppdatereBegrunnelse: {
                        nyBegrunnelse: value.begrunnelser[selectedRolleId],
                        rolleid: Number(selectedRolleId),
                    },
                };
                debouncedOnSave(payload);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, debouncedOnSave, selectedRolleId]);

    return (
        <>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <FormControlledCustomTextareaEditor
                    name={`begrunnelser.${selectedRolleId}`}
                    label={text.title.begrunnelse}
                    description={text.description.inntektBegrunnelseBM}
                    resize
                />
            )}
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && begrunnelseFraOpprinneligVedtak && (
                <CustomTextareaEditor
                    name={`begrunnelseFraOpprinneligVedtak.${selectedRolleId}`}
                    label={text.label.begrunnelseFraOpprinneligVedtak}
                    value={begrunnelseFraOpprinneligVedtak.innhold}
                    resize
                    readOnly
                />
            )}
            <ActionButtons onNext={onNext} />
        </>
    );
};

const InntektForm = () => {
    const { erBisysVedtak, inntekterV2: inntektRoller } = useGetBehandlingV2();
    const virkningsdato = useVirkningsdato();
    const initialValues = useMemo(
        () => createInitialForskuddInntektValues(inntektRoller, virkningsdato, erBisysVedtak),
        [inntektRoller, virkningsdato, erBisysVedtak],
    );
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
