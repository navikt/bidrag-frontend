import type { SamhandlerBroadcastMessage } from "@bidrag/common";
import { useCallback, useState } from "react";
import { type UseFormReturn, useFormContext } from "react-hook-form";

import type { SakRedigeringData } from "../../sakvisning-schema";
import type {
    BarnBeggForeldreSkjemaData,
    BarnMedManglendeForeldreSkjemaData,
    ForelderMedBarnSkjemaData,
    ForelderUtenBarnSkjemaData,
} from "../opprett-sak-schema";

export type SamhandlerFormType =
    | UseFormReturn<ForelderMedBarnSkjemaData>
    | UseFormReturn<ForelderUtenBarnSkjemaData>
    | UseFormReturn<BarnBeggForeldreSkjemaData>
    | UseFormReturn<BarnMedManglendeForeldreSkjemaData>
    | UseFormReturn<SakRedigeringData>;

// Krever at komponenten er wrappet i en FormProvider
export function useSamhandlerHandling() {
    const form = useFormContext() as SamhandlerFormType;
    const [barnIndexSøkSamhandler, setBarnIndexSøkSamhandler] = useState<number | null>(null);
    const [erSamhandlerPopupÅpen, setErSamhandlerPopupÅpen] = useState(false);

    const resetReellMottakerFields = useCallback(
        (barnIndex: number | null) => {
            const formValues = form.getValues();

            // For Forelder-flyt (har valgteBarn array)
            if ("valgteBarn" in formValues && barnIndex !== null) {
                const forelderForm = form as
                    | UseFormReturn<ForelderMedBarnSkjemaData>
                    | UseFormReturn<ForelderUtenBarnSkjemaData>;

                forelderForm.setValue(`valgteBarn.${barnIndex}.reellMottakerType`, "ingen", { shouldValidate: false });
                forelderForm.setValue(`valgteBarn.${barnIndex}.reellMottaker`, "", { shouldValidate: false });
                forelderForm.setValue(`valgteBarn.${barnIndex}.reellMottakerNavn`, "", { shouldValidate: false });
            }
            // For Barn-flyt (har barn object)
            else if ("barn" in formValues) {
                const barnForm = form as
                    | UseFormReturn<BarnBeggForeldreSkjemaData>
                    | UseFormReturn<BarnMedManglendeForeldreSkjemaData>;

                barnForm.setValue("barn.reellMottakerType", "ingen", { shouldValidate: false });
                barnForm.setValue("barn.reellMottaker", "", { shouldValidate: false });
                barnForm.setValue("barn.reellMottakerNavn", "", { shouldValidate: false });
            } else if ("roller" in formValues && barnIndex !== null) {
                const barnForm = form as UseFormReturn<SakRedigeringData>;

                barnForm.setValue(`roller.${barnIndex}.reellMottakerType`, "ingen", { shouldValidate: false });
                barnForm.setValue(`roller.${barnIndex}.reellMottaker`, "", { shouldValidate: false });
                barnForm.setValue(`roller.${barnIndex}.reellMottakerNavn`, "", { shouldValidate: false });
            }
        },
        [form],
    );

    const leggTilSamhandler = useCallback(
        (reellMottaker: (SamhandlerBroadcastMessage & { barnIndex: number | null; ident?: string }) | null) => {
            // Hvis popup lukkes uten valg (null), reset radiogruppen umiddelbart

            const barnIndexSøkSamhandler = reellMottaker?.barnIndex ?? null;
            if (reellMottaker === null) {
                resetReellMottakerFields(barnIndexSøkSamhandler);
                setErSamhandlerPopupÅpen(false);
                setBarnIndexSøkSamhandler(null);
                return;
            }

            const formValues = form.getValues();

            const reelMottakerIdent = reellMottaker.samhandlerId ?? reellMottaker.ident ?? reellMottaker.offentligId;
            // For Forelder-flyt (har valgteBarn array)
            if ("valgteBarn" in formValues) {
                if (barnIndexSøkSamhandler === null) {
                    return;
                }

                const forelderForm = form as
                    | UseFormReturn<ForelderMedBarnSkjemaData>
                    | UseFormReturn<ForelderUtenBarnSkjemaData>;

                forelderForm.setValue(`valgteBarn.${barnIndexSøkSamhandler}.reellMottaker`, reelMottakerIdent);
                forelderForm.setValue(`valgteBarn.${barnIndexSøkSamhandler}.reellMottakerNavn`, reellMottaker.navn);
            }
            // For Barn-flyt (har barn object)
            else if ("barn" in formValues) {
                const barnForm = form as
                    | UseFormReturn<BarnBeggForeldreSkjemaData>
                    | UseFormReturn<BarnMedManglendeForeldreSkjemaData>;

                barnForm.setValue("barn.reellMottaker", reelMottakerIdent);
                barnForm.setValue("barn.reellMottakerNavn", reellMottaker.navn);
            } else if ("roller" in formValues && barnIndexSøkSamhandler !== null) {
                const barnForm = form as UseFormReturn<SakRedigeringData>;

                barnForm.setValue(`roller.${barnIndexSøkSamhandler}.reellMottaker`, reelMottakerIdent);
                barnForm.setValue(`roller.${barnIndexSøkSamhandler}.reellMottakerNavn`, reellMottaker.navn);
            }
            setErSamhandlerPopupÅpen(false);
            setBarnIndexSøkSamhandler(null);
        },
        [form, barnIndexSøkSamhandler, resetReellMottakerFields],
    );

    const lukkSamhandlerSøk = useCallback(() => {
        resetReellMottakerFields(barnIndexSøkSamhandler);
        setErSamhandlerPopupÅpen(false);
        setBarnIndexSøkSamhandler(null);
    }, [barnIndexSøkSamhandler, resetReellMottakerFields]);

    return {
        barnIndexSøkSamhandler,
        erSamhandlerPopupÅpen,
        leggTilSamhandler,
        lukkSamhandlerSøk,
    };
}
