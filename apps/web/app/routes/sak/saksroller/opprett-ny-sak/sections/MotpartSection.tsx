import type { PersonDto } from "@bidrag/api/PersonApi";
import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import ParterOppsummering from "../motpart-felles/ParterOppsummering";
import PartManuellRegistrering from "../motpart-felles/PartManuellRegistrering";
import type { ForelderMedBarnSkjemaData, ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";

interface MotpartSectionProps {
    form: UseFormReturn<ForelderMedBarnSkjemaData | ForelderUtenBarnSkjemaData>;
    onSettMotpartUkjent: () => void;
    onLeggTilMotpartManuell: (person: PersonDto) => void;
    bidragsmottakerRegistreringRef: RefObject<HTMLDialogElement | null>;
    visOppsummering?: boolean;
}

/**
 * Section for managing motpart (counterparty) in forelder flows.
 * Combines ParterOppsummering and PartManuellRegistrering components.
 */
export default function MotpartSection({
    form,
    onSettMotpartUkjent,
    onLeggTilMotpartManuell,
    bidragsmottakerRegistreringRef,
    visOppsummering = true,
}: MotpartSectionProps) {
    const valgteBarn = form.watch("valgteBarn");
    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");
    const foreldre = form.watch("foreldre" as never) as Array<{ erKjent?: boolean }> | undefined;
    const harUkjentForelderIForeldreListe = foreldre?.some((forelder) => forelder?.erKjent === false) ?? false;
    const harUkjentForelder =
        partISaken?.erKjent === false || motpart?.erKjent === false || harUkjentForelderIForeldreListe;
    const skalViseOppsummering = (visOppsummering && valgteBarn.length > 0) || harUkjentForelder;

    return (
        <>
            {skalViseOppsummering && (
                <ParterOppsummering
                    form={form as UseFormReturn<ForelderMedBarnSkjemaData>}
                    onSettMotpartUkjent={onSettMotpartUkjent}
                    ref={bidragsmottakerRegistreringRef}
                />
            )}

            <PartManuellRegistrering
                ref={bidragsmottakerRegistreringRef}
                bidragstype="bidragsmottaker"
                onLeggTil={onLeggTilMotpartManuell}
            />
        </>
    );
}
