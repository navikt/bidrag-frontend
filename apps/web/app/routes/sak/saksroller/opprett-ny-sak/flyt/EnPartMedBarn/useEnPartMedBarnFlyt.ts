import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import { grupperBarnIKurver } from "../../barn/barnkurver";
import { useFjernBarnUtenforKurver } from "../../barn/useFjernBarnUtenforKurver";
import { useFlowSubmission } from "../../innsending/useFlowSubmission";
import type { FarskapsSkjemaSchemaData, ForelderPartRolle } from "../../skjema/opprett-sak-schema";

const UKJENT = { ident: "", navn: "", erKjent: false };

/**
 * Felles oppsett for flyter der saken opprettes med én kjent part og valgte barn,
 * uten kjent motpart (farskap og oppfostringsbidrag). Barna hentes for parten som er valgt i skjemaet.
 */
export function useEnPartMedBarnFlyt({
    arbeidsfordeling,
    rolle,
}: {
    arbeidsfordeling: "FRS" | "OPS";
    rolle: ForelderPartRolle;
}) {
    const form = useFormContext<FarskapsSkjemaSchemaData>();
    const valgteBarn = form.watch("valgteBarn");
    const partISaken = form.watch("partISaken");

    const { data, isLoading, isError } = useHentPersonMotpartBarnRelasjon(
        partISaken.ident ? { ident: partISaken.ident } : null,
    );
    const barnkurver = grupperBarnIKurver(partISaken.ident ? (data?.personensMotpartBarnRelasjon ?? []) : []);

    useFjernBarnUtenforKurver(form, barnkurver, isLoading);

    const part = { ...partISaken, erKjent: !!partISaken.ident };
    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        bidragspliktig: rolle === "bidragspliktig" ? part : UKJENT,
        bidragsmottaker: rolle === "bidragsmottaker" ? part : UKJENT,
        arbeidsfordeling,
        valgteBarn,
    });

    return {
        form,
        barnkurver,
        valgteBarn,
        onSubmit,
        innsending,
        lasterKurver: isLoading,
        kurvfeil: isError,
        status: {
            ...sakStatus,
            partISakenNavn: partISaken.navn || partISaken.ident,
            motpartNavn: "Ukjent",
        },
    };
}
