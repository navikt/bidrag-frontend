import type { PersonDto } from "@bidrag/api/PersonApi";
import { VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import SøkPerson from "../../components/SøkPerson";
import ParterSeksjon from "../felles/ParterSeksjon";
import type { ForelderMedBarnSkjemaData, ForelderPartRolle, ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";

interface MotpartSectionProps {
    form: UseFormReturn<ForelderMedBarnSkjemaData | ForelderUtenBarnSkjemaData>;
    onLeggTilMotpartManuell: (person: PersonDto) => void;
    motpartvalg?: ReactNode;
    visPersonsøk?: boolean;
}

export default function MotpartSection({
    form,
    onLeggTilMotpartManuell,
    motpartvalg,
    visPersonsøk = true,
}: MotpartSectionProps) {
    const valgteBarn = form.watch("valgteBarn");
    const partISaken = form.watch("partISaken");
    const motpart = form.watch("motpart");
    const foreldre = form.watch("foreldre" as never) as Array<{ erKjent?: boolean }> | undefined;
    const skalViseParter = valgteBarn.length > 0 || harUkjentForelder([partISaken, motpart, ...(foreldre ?? [])]);
    const partISakenRolle = tilForelderPartRolle(partISaken.rolle);
    const motpartRolle = tilForelderPartRolle(motpart.rolle);

    const motpartInnhold =
        motpart.erKjent === true || !visPersonsøk ? (
            motpartvalg
        ) : (
            <VStack gap="space-12">
                {motpartvalg}
                <SøkPerson label={`Søk etter ${motpartRolle}`} personInformasjon={onLeggTilMotpartManuell} compact />
            </VStack>
        );

    return (
        <ParterSeksjon
            partISaken={{ ...partISaken, erKjent: true }}
            partISakenRolle={partISakenRolle}
            motpart={motpart}
            motpartRolle={motpartRolle}
            motpartInnhold={motpartInnhold}
            visParter={skalViseParter}
            feil={form.formState.errors.motpart?.ident?.message}
        />
    );
}

function harUkjentForelder(personer: Array<{ erKjent?: boolean } | undefined>) {
    return personer.some((person) => person?.erKjent === false);
}

function tilForelderPartRolle(rolle?: string): ForelderPartRolle {
    return rolle === "bidragspliktig" ? "bidragspliktig" : "bidragsmottaker";
}
