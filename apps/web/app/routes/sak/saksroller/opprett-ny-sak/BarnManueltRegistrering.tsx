import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import { PlusIcon } from "@navikt/aksel-icons";
import { Box, Button } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import SøkPerson from "../components/SøkPerson";
import { type Barnkurv, type ForelderMedBarnSkjemaData, MAKS_ALDER_BARN } from "./opprett-sak-schema";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<ForelderMedBarnSkjemaData>;
    leggTilBarnMauell: (barn: PersonDto, alder: number) => void;
};

export default function BarnManueltRegistrering({ form, leggTilBarnMauell, barnkurver }: Props) {
    const valgteBarn = form.getValues("valgteBarn");
    const [visSok, setVisSok] = useState(false);

    const håndterSøk = async (barn: PersonDto) => {
        if (valgteBarn.some((b) => b.ident === barn.ident)) {
            if (barn?.visningsnavn && barn?.ident) {
                throw new Error(
                    `${barn.visningsnavn} (${barn.ident}) er allerede i listen over valgte barn. Vennligst velg fra listen over tilgjengelige barn over.`,
                );
            } else if (barn?.ident) {
                throw new Error(
                    `Dette barnet (${barn.ident}) er allerede i listen over valgte barn. Vennligst velg fra listen over tilgjengelige barn over.`,
                );
            } else {
                throw new Error(
                    "Dette barnet er allerede i listen over valgte barn. Vennligst velg fra listen over tilgjengelige barn over.",
                );
            }
        }

        if (barnkurver?.some((kurv) => kurv.barn.some((s) => s.ident === barn.ident))) {
            if (barn?.visningsnavn && barn?.ident) {
                throw new Error(
                    `${barn.visningsnavn} (${barn.ident}) finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.`,
                );
            } else if (barn?.ident) {
                throw new Error(
                    `Dette barnet (${barn.ident}) finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.`,
                );
            } else {
                throw new Error(
                    "Dette barnet finnes allerede i listen over barn som kan legges til. Vennligst velg fra listen over.",
                );
            }
        }

        const alder = barn?.fødselsdato ? beregnAlder(barn.fødselsdato) : beregnAlderFraFnr(barn.ident);

        if (alder === null) {
            throw new Error("Kunne ikke beregne alder for barnet.");
        }

        if (alder > MAKS_ALDER_BARN) {
            if (barn?.visningsnavn && barn?.ident) {
                throw new Error(
                    `${barn.visningsnavn} (${barn.ident}) er ${alder} år og kan ikke legges til i saken. Maks alder er 24 år.`,
                );
            } else if (barn?.ident) {
                throw new Error(
                    `Dette barnet (${barn.ident}) er ${alder} år og kan ikke legges til i saken. Maks alder er 24 år.`,
                );
            } else {
                throw new Error(`Barnet er over ${MAKS_ALDER_BARN} år og kan ikke legges til`);
            }
        }

        leggTilBarnMauell(barn, alder);
    };

    return (
        <div className="space-y-3 self-end">
            {!visSok && (
                <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    icon={<PlusIcon aria-hidden />}
                    onClick={() => setVisSok(true)}
                >
                    Legg til barn manuelt
                </Button>
            )}
            {visSok && (
                <Box as="div" padding="space-4" borderWidth="1" borderColor="accent" className="space-y-3">
                    <Button
                        type="button"
                        variant="tertiary"
                        className="flex self-end justify-end justify-self-end"
                        size="small"
                        onClick={() => setVisSok(false)}
                    >
                        Lukk søk
                    </Button>
                    <div className="mt-2">
                        <SøkPerson label="Oppgi barn i saken manuelt" personInformasjon={håndterSøk} />
                    </div>
                </Box>
            )}
        </div>
    );
}
