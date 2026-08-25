import { type OppdatereBoforholdRequestV2, Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import React, { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { ActionButtons } from "../../../../common/components/ActionButtons";
import { CustomTextareaEditor } from "../../../../common/components/CustomEditor";
import { FormControlledCustomTextareaEditor } from "../../../../common/components/formFields/FormControlledCustomTextEditor";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { useFieldMutationStatus } from "../../../../common/hooks/useFieldMutationStatus";
import { useOnSaveBoforhold } from "../../../../common/hooks/useOnSaveBoforhold";
import type { BoforholdFormValues } from "../../../../common/types/boforholdFormValues";
import { STEPS } from "../../../constants/steps";
import { SærligeutgifterStepper } from "../../../enum/SærligeutgifterStepper";

export const Begrunnelse = () => {
    const { onStepChange, setSaveErrorState } = useBehandlingProvider();
    const {
        erBisysVedtak,
        vedtakstype,
        boforhold: { begrunnelseFraOpprinneligVedtak },
    } = useGetBehandlingV2();
    const { watch, getValues, setValue } = useFormContext<BoforholdFormValues>();
    const saveBoforhold = useOnSaveBoforhold();
    const [previousValue, setPreviousValues] = useState<string>(getValues("begrunnelse"));
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const mutationState = useFieldMutationStatus(saveBoforhold.mutation, "begrunnelse");

    const onSave = useCallback(
        (payload: OppdatereBoforholdRequestV2) =>
            saveBoforhold.mutation.mutate(
                { triggeredBy: "begrunnelse", ...payload },
                {
                    onSuccess: (response) => {
                        setPreviousValues(response.begrunnelse);
                    },
                    onError: () => {
                        setSaveErrorState({
                            error: true,
                            retryFn: () => onSave(payload),
                            rollbackFn: () => {
                                setValue("begrunnelse", previousValue ?? "");
                            },
                        });
                    },
                },
            ),
        [saveBoforhold, setPreviousValues, setSaveErrorState, previousValue, setValue],
    );
    const onNext = () => onStepChange(STEPS[SærligeutgifterStepper.VEDTAK]);

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (["begrunnelse"].includes(name) && (type === "change" || type === undefined)) {
                const payload = { oppdatereBegrunnelse: { nyBegrunnelse: value.begrunnelse } };
                debouncedOnSave(payload);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, debouncedOnSave]);

    return (
        <>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <FormControlledCustomTextareaEditor
                    label={text.title.begrunnelse}
                    name="begrunnelse"
                    mutationState={mutationState}
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
        </>
    );
};
