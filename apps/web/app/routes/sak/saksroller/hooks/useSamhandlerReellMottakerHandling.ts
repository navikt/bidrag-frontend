import { useCallback } from "react";
import { type UseFormReturn, useFormContext } from "react-hook-form";

import type { SakRedigeringData } from "../sakvisning-schema.ts";

type SamhandlerEllerPersonResultat = {
    samhandlerId?: string;
    ident?: string;
    offentligId?: string;
    navn?: string | null;
    barnIndex?: number;
};

/**
 * Forenklet variant av samhandler-håndtering for reell mottaker-søk i sakvisning.
 * Krever at komponenten er wrappet i en FormProvider<SakRedigeringData>.
 */
export function useSamhandlerReellMottakerHandling() {
    const form = useFormContext() as UseFormReturn<SakRedigeringData>;

    const leggTilSamhandler = useCallback(
        (data: SamhandlerEllerPersonResultat | null) => {
            if (!data || data.barnIndex === undefined || data.barnIndex === null) {
                return;
            }

            const ident = data.samhandlerId ?? data.ident ?? data.offentligId ?? "";
            form.setValue(`roller.${data.barnIndex}.reellMottaker`, ident);
            form.setValue(`roller.${data.barnIndex}.reellMottakerNavn`, data.navn ?? undefined);
        },
        [form],
    );

    return { leggTilSamhandler };
}
