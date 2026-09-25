import type { MotpartBarnRelasjon } from "@bidrag/api/PersonApi";
import { useFormContext } from "react-hook-form";

import type { FarskapsSkjemaSchemaData } from "../opprett-sak-schema";
import { grupperBarnIKurver } from "../utils";
import { useFlowSubmission } from "./useFlowSubmission";

/**
 * Felles oppsett for flyter der saken opprettes med én kjent part og valgte barn,
 * uten kjent motpart (farskap og oppfostringsbidrag).
 */
export function useEnPartMedBarnFlyt({
    registrerteKurver,
    arbeidsfordeling,
}: {
    registrerteKurver: MotpartBarnRelasjon[];
    arbeidsfordeling: "FRS" | "OPS";
}) {
    const form = useFormContext<FarskapsSkjemaSchemaData>();
    const barnkurver = grupperBarnIKurver(registrerteKurver);

    const valgteBarn = form.watch("valgteBarn");
    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");

    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        partISaken: { ...partISaken, erKjent: !!partISaken.ident },
        motpart,
        arbeidsfordeling,
        valgteBarn,
    });

    return {
        form,
        barnkurver,
        valgteBarn,
        onSubmit,
        innsending,
        status: {
            ...sakStatus,
            partISakenNavn: partISaken.navn || partISaken.ident,
            motpartNavn: "Ukjent",
        },
    };
}
