import type { UseFormReturn } from "react-hook-form";

import type { EktefellebidragSkjemaData, ForelderPartRolle } from "../opprett-sak-schema";
import OppsummeringSection from "../sections/OppsummeringSection";

type Props = {
    form: UseFormReturn<EktefellebidragSkjemaData>;
};

export default function EktefellebidragOppsummering({ form }: Props) {
    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");

    const bp = partISaken.rolle === "bidragspliktig" ? partISaken : motpart;
    const bm = partISaken.rolle === "bidragsmottaker" ? partISaken : motpart;
    const partISakenRolle = partISaken.rolle as ForelderPartRolle;

    return (
        <OppsummeringSection
            bidragspliktig={{
                rolle: "bidragspliktig",
                ident: bp.ident,
                navn: bp.navn,
                erKjent: true,
                diskresjonskode: bp.diskresjonskode,
            }}
            bidragsmottaker={{
                rolle: "bidragsmottaker",
                ident: bm.ident,
                navn: bm.navn,
                erKjent: true,
                diskresjonskode: bm.diskresjonskode,
            }}
            barn={[]}
            partISakenRolle={partISakenRolle}
        />
    );
}
