import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import { PlusIcon } from "@navikt/aksel-icons";
import { Button, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PersonSøkWrapper from "../PersonSøkWrapper";
import { type Barnkurv, type ForelderMedBarnSkjemaData, MAKS_ALDER_BARN } from "./opprett-sak-schema";

type Props = {
    barnkurver: Barnkurv[];
    form: UseFormReturn<ForelderMedBarnSkjemaData>;
    leggTilBarnMauell: (barn: PersonDto, alder: number) => void;
};

export default function BarnManueltRegistrering({ form, leggTilBarnMauell, barnkurver }: Props) {
    const [visSok, setVisSok] = useState(false);

    const håndterSøk = async (barn: PersonDto) => {
        const valgteBarn = form.getValues("valgteBarn");

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
        <VStack gap="space-12" className="self-end">
            <Button
                type="button"
                variant="secondary"
                size="small"
                icon={<PlusIcon aria-hidden />}
                onClick={() => setVisSok(true)}
            >
                Legg til barn manuelt
            </Button>
            {visSok && (
                <PersonSøkWrapper
                    tittel="Legg til barn manuelt"
                    beskrivelse="Søk opp barnet som skal legges til i saken"
                    søkeLabel="Oppgi barn i saken manuelt"
                    onPersonValgt={async (person) => {
                        await håndterSøk(person);
                        setVisSok(false);
                    }}
                    onAvbryt={() => setVisSok(false)}
                />
            )}
        </VStack>
    );
}
