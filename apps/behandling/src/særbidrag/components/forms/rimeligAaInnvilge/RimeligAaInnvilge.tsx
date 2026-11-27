import type { OppdatereUtgiftResponse } from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyLong } from "@navikt/ds-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
import { opprettSekvensiellLagring } from "./sekvensiellLagring";

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

    // Leser skjemaverdiene når lagringen sendes, ikke når endringen skjer
    const lagre = async (name: string) => {
        const values = { ...getValues() };
        const payload: UtgifterPayload = {
            triggeredBy: name === "begrunnelse" ? "rimeligÅInnvilgeBegrunnelse" : "rimeligÅInnvilge",
            rimeligÅInnvilge: {
                rimeligÅInnvilge: values.rimeligÅInnvilge,
                begrunnelse: values.begrunnelse,
            },
        };
        try {
            await saveUtgifter.mutation.mutateAsync(payload);
            // Angre går tilbake til verdiene som sist ble lagret, ikke til verdier som er endret etter at lagringen ble sendt
            prevState.current = values;
        } catch {
            setSaveErrorState({
                error: true,
                retryFn: () => onSave(name),
                rollbackFn: () => useFormMethods.reset(prevState.current),
            });
        }
    };
    const sisteLagre = useRef(lagre);
    sisteLagre.current = lagre;
    const sekvensiellLagring = useRef(opprettSekvensiellLagring((name: string) => sisteLagre.current(name)));
    const onSave = (name: string) => sekvensiellLagring.current(name);
    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = useFormMethods.watch((_, { name, type }) => {
            if (name === undefined || type === undefined) return;
            if (name === "begrunnelse" && type === "change") {
                debouncedOnSave(name);
            } else {
                onSave(name);
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
