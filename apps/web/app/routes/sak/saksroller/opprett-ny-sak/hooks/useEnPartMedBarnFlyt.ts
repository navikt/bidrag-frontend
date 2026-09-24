import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import type { FarskapsSkjemaSchemaData, ForelderPartRolle } from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";
import { grupperBarnIKurver } from "../utils";
import { useFlowSubmission } from "./useFlowSubmission";
import useSyncKategori from "./useSyncKategori";

type EnPartMedBarnFlytType = "FARSKAP" | "OPPFOSTRINGSBIDRAG";

/**
 * Felles oppsett for flyter der saken opprettes med én kjent part og valgte barn,
 * uten kjent motpart (farskap og oppfostringsbidrag).
 */
export function useEnPartMedBarnFlyt({
    flytType,
    arbeidsfordeling,
    rolle,
}: {
    flytType: EnPartMedBarnFlytType;
    arbeidsfordeling: "FRS" | "OPS";
    rolle: ForelderPartRolle;
}) {
    const { saksrolleFlyt, partISaken: partISakenContext } = useSaksrolleroversikt();
    const form = useFormContext<FarskapsSkjemaSchemaData>();
    useSyncKategori(form);
    const barnkurver = grupperBarnIKurver(saksrolleFlyt?.type === flytType ? saksrolleFlyt.barnkurver : []);

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

    useEffect(() => {
        if (!partISaken.ident && partISakenContext?.ident) {
            form.setValue(
                "partISaken",
                { ...partISakenContext, rolle, erKjent: true },
                { shouldDirty: true, shouldValidate: true },
            );
        }
    }, [form, partISaken.ident, partISakenContext, rolle]);

    const kjentPart = partISaken.ident
        ? {
              rolle,
              ident: partISaken.ident,
              navn: partISaken.navn,
              erKjent: true,
              diskresjonskode: partISaken.diskresjonskode,
          }
        : null;

    return {
        form,
        barnkurver,
        valgteBarn,
        kjentPart,
        onSubmit,
        innsending,
        status: {
            ...sakStatus,
            partISakenNavn: partISaken.navn || partISaken.ident,
            motpartNavn: "Ukjent",
        },
    };
}
