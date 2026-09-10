import type { PersonDto } from "@bidrag/api/PersonApi";
import { CheckmarkHeavyIcon, PersonPlusIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import FunnetPersonInfo from "../../../components/FunnetPersonInfo";
import SøkPerson from "../../../components/SøkPerson";
import type { BarnMedManglendeForeldreSkjemaData, ForelderMedRolle, ForelderPartRolle } from "../../opprett-sak-schema";
import { hentForelderRolleLabel, hentMotsattRolle } from "../../utils";
import ForelderRolleVelger from "./ForelderRolleVelger";

type Props = {
    form: UseFormReturn<BarnMedManglendeForeldreSkjemaData>;
    foreldre: ForelderMedRolle[];
    antallManglende: number;
    kjentForelderIndex: number | null;
    onVelgRolle: (index: number, rolle: ForelderPartRolle) => void;
};

export default function LeggTilForelderSeksjon({
    form,
    foreldre,
    antallManglende,
    kjentForelderIndex,
    onVelgRolle,
}: Props) {
    const errors = form.formState.errors;

    const fjernForelder = (index: number) => {
        form.setValue(`foreldre.${index}.ident`, "");
        form.setValue(`foreldre.${index}.navn`, "");
        form.setValue(`foreldre.${index}.rolle`, null);
        form.setValue(`foreldre.${index}.erKjent`, undefined);
    };

    const leggTilForelder = (person: PersonDto, index: number) => {
        const duplikatPerson = foreldre.find((f) => f.ident === person.ident);
        if (duplikatPerson) {
            const personInfo = person?.visningsnavn
                ? `${person.visningsnavn} (${person.ident})`
                : person?.ident
                  ? `Denne personen (${person.ident})`
                  : "Denne personen";

            throw new Error(
                `${personInfo} er allerede registrert som ${duplikatPerson.rolle} og kan ikke legges til på nytt.`,
            );
        }

        const andreIndex = index === 0 ? 1 : 0;
        const kjentForelderRolle = form.watch(`foreldre.${andreIndex}.rolle`);

        form.setValue(`foreldre.${index}`, {
            ident: person.ident,
            navn: person.visningsnavn,
            erKjent: true,
            diskresjonskode: person.diskresjonskode,
            rolle: kjentForelderRolle !== null ? hentMotsattRolle(kjentForelderRolle) : null,
        });
    };

    const settForelderUkjent = (index: number) => {
        const andreIndex = index === 0 ? 1 : 0;
        const kjentForelderRolle = form.watch(`foreldre.${andreIndex}.rolle`);

        form.setValue(`foreldre.${index}`, {
            ident: "",
            navn: "",
            erKjent: false,
            diskresjonskode: undefined,
            rolle: kjentForelderRolle !== null ? hentMotsattRolle(kjentForelderRolle) : null,
        });
    };

    return (
        <VStack gap="space-24">
            <HStack align="center" gap="space-8">
                <PersonPlusIcon fontSize="1.5rem" aria-hidden />
                <Heading level="2" size="medium">
                    Legg til {antallManglende === 2 ? "foreldre" : "manglende forelder"}
                </Heading>
            </HStack>

            <BodyShort size="small" textColor="subtle">
                {antallManglende === 2
                    ? "Dette barnet har ingen registrerte foreldre. Legg til begge foreldre manuelt."
                    : "Legg til den andre forelderen manuelt."}
            </BodyShort>

            <VStack gap="space-24">
                {foreldre.map((forelder, index) => {
                    if (kjentForelderIndex !== null && index === kjentForelderIndex) {
                        return null;
                    }

                    const erLagtTil = typeof forelder.erKjent === "boolean";
                    const harRolle = forelder.rolle !== null;
                    const erUkjent = typeof forelder.erKjent === "boolean" && !forelder.erKjent;

                    return (
                        <Box
                            key={index}
                            padding="space-16"
                            borderRadius="8"
                            borderWidth="1"
                            borderColor="neutral"
                            background="default"
                            className="shadow-sm"
                        >
                            <HStack align="center" justify="space-between" marginBlock="space-0 space-12">
                                <Heading level="3" size="small" textColor="default">
                                    Forelder #{index + 1}
                                </Heading>
                            </HStack>

                            {!erLagtTil && (
                                <div>
                                    <SøkPerson
                                        label={`Søk forelder #${index + 1}`}
                                        personInformasjon={(person) => leggTilForelder(person, index)}
                                    />
                                    <HStack justify="center" marginBlock="space-12 space-0">
                                        <Button
                                            type="button"
                                            size="small"
                                            variant="tertiary"
                                            onClick={() => settForelderUkjent(index)}
                                        >
                                            Eller sett som ukjent
                                        </Button>
                                    </HStack>
                                </div>
                            )}

                            {erLagtTil && (
                                <VStack gap="space-12">
                                    {erUkjent ? (
                                        <FunnetPersonInfo
                                            label="Forelder:"
                                            navn="Ukjent"
                                            fjern={() => fjernForelder(index)}
                                            bakgrunn="bg-ax-warning-200"
                                            border="border-ax-warning-600"
                                            ikon="text-ax-warning-700"
                                        />
                                    ) : (
                                        <FunnetPersonInfo
                                            navn={forelder.navn}
                                            ident={forelder.ident}
                                            diskresjonskode={forelder.diskresjonskode}
                                            fjern={() => fjernForelder(index)}
                                            bakgrunn="bg-ax-accent-100"
                                            border="border-ax-accent-200"
                                            ikon="text-ax-accent-700"
                                        />
                                    )}

                                    <ForelderRolleVelger
                                        value={forelder.rolle}
                                        onChange={(rolle) => onVelgRolle(index, rolle)}
                                        error={errors.foreldre?.[index]?.rolle?.message}
                                    />

                                    {harRolle && forelder.rolle && (
                                        <HStack asChild align="center">
                                            <BodyShort
                                                size="small"
                                                weight="semibold"
                                                className="text-ax-success-800"
                                            >
                                                <CheckmarkHeavyIcon aria-hidden fontSize="1.3rem" /> Rolle valgt:{" "}
                                                {hentForelderRolleLabel(forelder.rolle)}
                                            </BodyShort>
                                        </HStack>
                                    )}
                                </VStack>
                            )}
                        </Box>
                    );
                })}
            </VStack>
        </VStack>
    );
}
