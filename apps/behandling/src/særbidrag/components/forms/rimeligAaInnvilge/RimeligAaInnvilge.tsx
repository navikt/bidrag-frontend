import type { OppdatereUtgiftResponse } from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyLong } from "@navikt/ds-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { FormControlledCheckbox } from "../../../../common/components/formFields/FormControlledCheckbox";
import { FormControlledCustomTextareaEditor } from "../../../../common/components/formFields/FormControlledCustomTextEditor";
import { FlexRow } from "../../../../common/components/layout/grid/FlexRow";
import { NewFormLayout } from "../../../../common/components/layout/grid/NewFormLayout";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { type UtgifterPayload, useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { SærligeutgifterStepper } from "../../../enum/SærligeutgifterStepper";
import { useOnSaveUtgifter } from "../../../hooks/useOnSaveUtgifter";

type RimeligAaInnvilgeFormValues = {
    rimeligÅInnvilge: boolean;
    begrunnelse: string;
};

const Main = () => {
    const {
        utgift: { rimeligÅInnvilge },
    } = useGetBehandlingV2();

    if (!rimeligÅInnvilge?.barnetsInntektErOverGrensen) {
        return <BodyLong size="small">{text.description.rimeligÅInnvilgeIkkeAktuelt}</BodyLong>;
    }

    return (
        <>
            <BodyLong size="small">{text.description.rimeligÅInnvilge}</BodyLong>
            <FlexRow>
                <FormControlledCheckbox name="rimeligÅInnvilge" legend={text.label.rimeligÅInnvilge} />
            </FlexRow>
        </>
    );
};

const Side = ({
    mutation,
}: {
    mutation: UseMutationResult<OppdatereUtgiftResponse, Error, UtgifterPayload, unknown>;
}) => {
    const { onStepChange, getNextStep } = useBehandlingProvider();
    const {
        utgift: { rimeligÅInnvilge },
    } = useGetBehandlingV2();
    const mutationState = useFieldMutationStatus(mutation, "rimeligÅInnvilgeBegrunnelse");
    const onNext = () => onStepChange(getNextStep(SærligeutgifterStepper.RIMELIG_Å_INNVILGE));

    return (
        <>
            {rimeligÅInnvilge?.barnetsInntektErOverGrensen && (
                <>
                    <FormControlledCustomTextareaEditor
                        label={text.title.begrunnelse}
                        name="begrunnelse"
                        mutationState={mutationState}
                        resize
                    />
                    {rimeligÅInnvilge.valideringsfeil?.manglerBegrunnelse && (
                        <Alert variant="warning" size="small" inline>
                            {text.error.manglerBegrunnelse}
                        </Alert>
                    )}
                </>
            )}
            <ActionButtons onNext={onNext} />
        </>
    );
};

const RimeligAaInnvilgeForm = () => {
    const {
        utgift: { rimeligÅInnvilge },
    } = useGetBehandlingV2();
    const initialValues: RimeligAaInnvilgeFormValues = {
        rimeligÅInnvilge: rimeligÅInnvilge?.rimeligÅInnvilge ?? false,
        begrunnelse: rimeligÅInnvilge?.begrunnelse ?? "",
    };
    const saveUtgifter = useOnSaveUtgifter();
    const prevState = useRef<RimeligAaInnvilgeFormValues>(initialValues);
    const { setSaveErrorState } = useBehandlingProvider();
    const useFormMethods = useForm<RimeligAaInnvilgeFormValues>({ defaultValues: initialValues });
    const { getValues } = useFormMethods;

    const updateAndSave = useCallback(
        async (payload: UtgifterPayload) => {
            try {
                await saveUtgifter.mutation.mutateAsync(payload);
                prevState.current = { ...getValues() };
            } catch {
                setSaveErrorState({
                    error: true,
                    retryFn: () => updateAndSave(payload),
                    rollbackFn: () => useFormMethods.reset(prevState.current),
                });
            }
        },
        [saveUtgifter, prevState, useFormMethods, getValues, setSaveErrorState],
    );

    const onSave = (values: RimeligAaInnvilgeFormValues, name: string) =>
        updateAndSave({
            triggeredBy: name === "begrunnelse" ? "rimeligÅInnvilgeBegrunnelse" : "rimeligÅInnvilge",
            rimeligÅInnvilge: {
                rimeligÅInnvilge: values.rimeligÅInnvilge,
                begrunnelse: values.begrunnelse,
            },
        });
    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = useFormMethods.watch((value, { name, type }) => {
            if (name === undefined || type === undefined) return;
            const formValues = value as RimeligAaInnvilgeFormValues;
            if (name === "begrunnelse" && type === "change") {
                debouncedOnSave(formValues, name);
            } else {
                onSave(formValues, name);
            }
        });
        return () => subscription.unsubscribe();
    }, [useFormMethods.watch]);

    return (
        <FormProvider {...useFormMethods}>
            <form>
                <NewFormLayout
                    title={text.title.rimeligÅInnvilge}
                    main={<Main />}
                    side={<Side mutation={saveUtgifter.mutation} />}
                />
            </form>
        </FormProvider>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <RimeligAaInnvilgeForm />
        </QueryErrorWrapper>
    );
};
