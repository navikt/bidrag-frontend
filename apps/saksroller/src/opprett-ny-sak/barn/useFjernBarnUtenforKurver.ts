import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";

/** Fjerner valgte kurvbarn som ikke lenger vises etter at partene er endret. Manuelt lagt til barn beholdes. */
export function useFjernBarnUtenforKurver<T extends { valgteBarn: BarnMedAlder[] }>(
    skjema: UseFormReturn<T>,
    barnkurver: Barnkurv[],
    laster: boolean,
) {
    const form = skjema as unknown as UseFormReturn<{ valgteBarn: BarnMedAlder[] }>;
    const synligeKurvbarn = barnkurver.flatMap((kurv) => kurv.barn.map((b) => b.ident)).join();
    useEffect(() => {
        if (laster) return;
        const synlige = synligeKurvbarn.split(",");
        const valgte = form.getValues("valgteBarn");
        const beholdt = valgte.filter((b) => b.manuellLagtTil || synlige.includes(b.ident));
        if (beholdt.length !== valgte.length) form.setValue("valgteBarn", beholdt);
    }, [form, synligeKurvbarn, laster]);
}
