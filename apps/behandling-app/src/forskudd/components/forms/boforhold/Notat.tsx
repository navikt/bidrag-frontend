import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import React, { useEffect, useState } from "react";
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

import { ForskuddStepper } from "../../../enum/ForskuddStepper";

export const Notat = () => {
    const { onStepChange, setSaveErrorState, getNextStep } = useBehandlingProvider();
    const { watch, getValues, setValue } = useFormContext<BoforholdFormValues>();
    const saveBoforhold = useOnSaveBoforhold();
    const {
        erBisysVedtak,
        vedtakstype,
        boforhold: { begrunnelseFraOpprinneligVedtak },
    } = useGetBehandlingV2();
    const [previousValues, setPreviousValues] = useState<string>(getValues("begrunnelse"));
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const mutationState = useFieldMutationStatus(saveBoforhold.mutation, "begrunnelse");

    const onSave = () =>
        saveBoforhold.mutation.mutate(
            { triggeredBy: "begrunnelse", oppdatereBegrunnelse: { nyBegrunnelse: getValues("begrunnelse") } },
            {
                onSuccess: (response) => {
                    setPreviousValues(response.begrunnelse);
                },
                onError: () => {
                    setSaveErrorState({
                        error: true,
                        retryFn: () => onSave(),
                        rollbackFn: () => {
                            setValue("begrunnelse", previousValues ?? "");
                        },
                    });
                },
            },
        );
    const onNext = () => onStepChange(getNextStep(ForskuddStepper.BOFORHOLD));

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((_, { name, type }) => {
            if (["begrunnelse"].includes(name) && type === "change") {
                debouncedOnSave();
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    return (
        <>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <FormControlledCustomTextareaEditor
                    name="begrunnelse"
                    label={text.title.begrunnelse}
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
