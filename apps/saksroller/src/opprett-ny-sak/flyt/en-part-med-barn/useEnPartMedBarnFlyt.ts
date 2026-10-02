import { useFormContext } from "react-hook-form";
import { useHentPersonMotpartBarnRelasjon } from "~/api/useApi.ts";
import { grupperBarnIKurver } from "../../barn/barnkurver";
import { useFjernBarnUtenforKurver } from "../../barn/useFjernBarnUtenforKurver";
import { useFlowSubmission } from "../../innsending/useFlowSubmission";
import type { FarskapsSkjemaSchemaData, ForelderPartRolle } from "../../skjema/opprett-sak-schema";

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
    const roller = form.watch("roller");
    const partType = rolle === "bidragspliktig" ? "BP" : "BM";
    const partISaken = roller.find((part) => part.type === partType) ?? {
        ident: "",
        navn: "",
        erKjent: undefined,
    };

    const { data, isLoading, isError } = useHentPersonMotpartBarnRelasjon(
        partISaken.ident ? { ident: partISaken.ident } : null,
    );
    const barnkurver = grupperBarnIKurver(partISaken.ident ? (data?.personensMotpartBarnRelasjon ?? []) : []);

    useFjernBarnUtenforKurver(form, barnkurver, isLoading);

    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        roller,
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
