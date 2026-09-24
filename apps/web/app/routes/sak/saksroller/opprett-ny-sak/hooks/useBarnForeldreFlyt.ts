import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import type { BarnBeggForeldreSkjemaData, ForelderPartRolle } from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";
import { hentMotsattRolle } from "../utils";
import { lagEksisterendeSakPart, useFlowSubmission } from "./useFlowSubmission";
import useSyncKategori from "./useSyncKategori";

/**
 * Felles oppsett for flyter der barnet er part i saken og to foreldre skal få
 * rollene bidragspliktig og bidragsmottaker.
 */
export function useBarnForeldreFlyt() {
    const { partISaken } = useSaksrolleroversikt();
    const form = useFormContext<BarnBeggForeldreSkjemaData>();
    useSyncKategori(form);

    useEffect(() => {
        if (partISaken) {
            form.setValue("barn.rolle", partISaken.rolle);
        }
    }, [partISaken]);

    const barn = form.watch("barn");
    const foreldre = form.watch("foreldre");

    const bidragspliktig = foreldre.find((f) => f.rolle === "bidragspliktig");
    const bidragsmottaker = foreldre.find((f) => f.rolle === "bidragsmottaker");
    const bidragsmottakerErUkjent = bidragsmottaker?.erKjent === false;

    const { onSubmit, sakStatus, innsending } = useFlowSubmission({
        form,
        partISaken: partISaken ?? form.getValues("barn"),
        valgteBarn: barn,
        bidragspliktig,
        bidragsmottaker,
        eksisterendeSakPartISaken: bidragspliktig ? lagEksisterendeSakPart(bidragspliktig, "bidragspliktig") : null,
        eksisterendeSakMotpart: bidragsmottaker ? lagEksisterendeSakPart(bidragsmottaker, "bidragsmottaker") : null,
    });

    const settRolle = (index: number, rolle: ForelderPartRolle) => {
        foreldre.forEach((_forelder, forelderIndex) => {
            form.clearErrors(`foreldre.${forelderIndex}`);
        });
        form.setValue(`foreldre.${index}.rolle`, rolle);
        form.setValue(`foreldre.${index === 0 ? 1 : 0}.rolle`, hentMotsattRolle(rolle));
    };

    const foreldrefeil = form.formState.errors.foreldre;

    return {
        form,
        barn,
        foreldre,
        bidragspliktig,
        bidragsmottakerErUkjent,
        barnKort: {
            form,
            barn,
            erPåkrevd: barn.rolle === "barn_over_18" || bidragsmottakerErUkjent,
            kanVelge: foreldre.every((f) => f.rolle !== null),
        },
        foreldreSeksjon: {
            foreldre,
            rollefeil: foreldre.map((_forelder, index) => foreldrefeil?.[index]?.rolle?.message),
            personfeil: foreldre.map((_forelder, index) => foreldrefeil?.[index]?.ident?.message),
            onVelgRolle: settRolle,
        },
        onSubmit,
        innsending,
        status: {
            ...sakStatus,
            partISakenNavn: bidragspliktig?.navn ?? "",
            motpartNavn: bidragsmottaker?.navn,
        },
    };
}
