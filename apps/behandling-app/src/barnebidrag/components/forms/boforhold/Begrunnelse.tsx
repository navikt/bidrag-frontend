import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
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

import { BarnebidragStepper } from "../../../enum/BarnebidragStepper";
import ForholdsmessigFordelingInfo from "../../../forholdsmessigfordeling/ForholdsmessigFordelingInfo";

export const Begrunnelse = () => {
    const { onStepChange, setSaveErrorState, getNextStep } = useBehandlingProvider();
    const {
        erBisysVedtak,
        vedtakstype,
        boforhold: { begrunnelseFraOpprinneligVedtak },
    } = useGetBehandlingV2();
    const { watch, getValues, setValue } = useFormContext<BoforholdFormValues>();
    const saveBoforhold = useOnSaveBoforhold();
    const [previousValue, setPreviousValues] = useState<string>(getValues("begrunnelse"));
    const erAldersjusteringsVedtakstype = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const begrunnelseMutationStatus = useFieldMutationStatus(saveBoforhold.mutation, "begrunnelse");

    const onSave = useCallback(
        async (nyBegrunnelse: string) => {
            try {
                const response = await saveBoforhold.mutation.mutateAsync({
                    triggeredBy: "begrunnelse",
                    oppdatereBegrunnelse: { nyBegrunnelse },
                });
                setPreviousValues(response.begrunnelse);
            } catch {
                setSaveErrorState({
                    error: true,
                    retryFn: () => onSave(nyBegrunnelse),
                    rollbackFn: () => {
                        setValue("begrunnelse", previousValue ?? "");
                    },
                });
            }
        },
        [saveBoforhold, previousValue, setValue, setPreviousValues, setSaveErrorState],
    );

    const debouncedOnSave = useDebounce(onSave);

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (["begrunnelse"].includes(name) && type === "change") {
                const nyBegrunnelse = value.begrunnelse;
                debouncedOnSave(nyBegrunnelse);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, debouncedOnSave]);

    return (
        <>
            <React.Suspense fallback={null}>
                <ForholdsmessigFordelingInfo />
            </React.Suspense>
            {!erBisysVedtak && !erAldersjusteringsVedtakstype && (
                <FormControlledCustomTextareaEditor
                    label={text.title.begrunnelse}
                    name="begrunnelse"
                    mutationState={begrunnelseMutationStatus}
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
            <ActionButtons onNext={() => onStepChange(getNextStep(BarnebidragStepper.BOFORHOLD))} />
        </>
    );
};
