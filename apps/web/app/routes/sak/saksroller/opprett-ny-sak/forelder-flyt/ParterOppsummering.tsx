import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ForelderPartRolle, ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";
import OppsummeringSection from "../sections/OppsummeringSection";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    onSettMotpartUkjent: () => void;
    ref: RefObject<HTMLDialogElement | null>;
};

export default function ParterOppsummering({ form, ref, onSettMotpartUkjent }: Props) {
    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");
    const valgteBarn = form.watch("valgteBarn");

    const bidragspliktig =
        partISaken.rolle === "bidragspliktig"
            ? {
                  rolle: "bidragspliktig" as const,
                  ident: partISaken.ident,
                  navn: partISaken.navn,
                  erKjent: true,
                  diskresjonskode: partISaken.diskresjonskode,
              }
            : {
                  rolle: "bidragspliktig" as const,
                  ident: motpart.ident,
                  navn: motpart.navn,
                  erKjent: motpart.erKjent,
                  diskresjonskode: motpart.diskresjonskode,
              };

    const bidragsmottaker =
        partISaken.rolle === "bidragsmottaker"
            ? {
                  rolle: "bidragsmottaker" as const,
                  ident: partISaken.ident,
                  navn: partISaken.navn,
                  erKjent: true,
                  diskresjonskode: partISaken.diskresjonskode,
              }
            : {
                  rolle: "bidragsmottaker" as const,
                  ident: motpart.ident,
                  navn: motpart.navn,
                  erKjent: motpart.erKjent,
                  diskresjonskode: motpart.diskresjonskode,
              };

    const onLeggTilMotpart = () => ref.current?.showModal();

    return (
        <OppsummeringSection
            bidragspliktig={bidragspliktig}
            bidragsmottaker={bidragsmottaker}
            barn={valgteBarn}
            partISakenRolle={partISaken.rolle as ForelderPartRolle}
            onSettBidragspliktigUkjent={partISaken.rolle === "bidragsmottaker" ? onSettMotpartUkjent : undefined}
            onSettBidragsmottakerUkjent={partISaken.rolle === "bidragspliktig" ? onSettMotpartUkjent : undefined}
            onLeggTilBidragspliktig={partISaken.rolle === "bidragsmottaker" ? onLeggTilMotpart : undefined}
            onLeggTilBidragsmottaker={partISaken.rolle === "bidragspliktig" ? onLeggTilMotpart : undefined}
        />
    );
}
