import type { PersonDto } from "@bidrag/api/PersonApi";
import { Alert, Button, HGrid, HStack, Radio, RadioGroup, Stack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import SøkPerson from "../../components/SøkPerson";
import type { ForelderMedRolle, ForelderPartRolle } from "../opprett-sak-schema";
import { ForelderPartRolleSchema } from "../opprett-sak-schema";
import { hentForelderRolleLabel } from "../utils";
import { RollePersonKort } from "./RollePersonKort";
import SkjemaSeksjon from "./SkjemaSeksjon";

type Props = {
    foreldre: ForelderMedRolle[];
    beskrivelse: string;
    rollefeil?: Array<string | undefined>;
    personfeil?: Array<string | undefined>;
    kanRegistrere?: (index: number) => boolean;
    onPersonValgt?: (person: PersonDto, index: number) => void;
    onSettUkjent?: (index: number) => void;
    onVelgRolle: (index: number, rolle: ForelderPartRolle) => void;
    handling?: (forelder: ForelderMedRolle, index: number) => ReactNode;
};

export default function ForeldreSeksjon({
    foreldre,
    beskrivelse,
    rollefeil,
    personfeil,
    kanRegistrere = () => false,
    onPersonValgt,
    onSettUkjent,
    onVelgRolle,
    handling,
}: Props) {
    return (
        <SkjemaSeksjon tittel="Foreldre" beskrivelse={beskrivelse}>
            <HGrid columns={{ xs: 1, md: 2 }} gap="space-16" align="start">
                {foreldre.map((forelder, index) => {
                    const erValgt = typeof forelder.erKjent === "boolean";
                    const erUkjent = forelder.erKjent === false;
                    const kanEndrePerson = kanRegistrere(index);
                    const forelderNavn = forelder.navn || `forelder ${index + 1}`;
                    const søk =
                        kanEndrePerson && onPersonValgt ? (
                            <VStack gap="space-12">
                                <SøkPerson
                                    label={`Søk etter forelder ${index + 1}`}
                                    personInformasjon={(person) => onPersonValgt(person, index)}
                                    compact
                                />
                                {!erUkjent && onSettUkjent && (
                                    <HStack>
                                        <Button
                                            type="button"
                                            size="small"
                                            variant="secondary-neutral"
                                            onClick={() => onSettUkjent(index)}
                                        >
                                            Registrer forelder {index + 1} som ukjent
                                        </Button>
                                    </HStack>
                                )}
                            </VStack>
                        ) : undefined;

                    return (
                        <RollePersonKort
                            key={index}
                            person={{ ...forelder, rolle: forelder.rolle ?? undefined }}
                            tittel={`Forelder ${index + 1}`}
                            førInnhold={søk}
                        >
                            {erValgt && (
                                <VStack gap="space-12">
                                    {personfeil?.[index] && <Alert variant="error">{personfeil[index]}</Alert>}
                                    <RadioGroup
                                        legend={`Velg rolle for ${forelderNavn}`}
                                        size="small"
                                        value={forelder.rolle ?? ""}
                                        onChange={(rolle) => onVelgRolle(index, rolle as ForelderPartRolle)}
                                        error={rollefeil?.[index]}
                                    >
                                        <Stack
                                            gap="space-0 space-24"
                                            direction={{ xs: "column", sm: "row" }}
                                            wrap={false}
                                        >
                                            {ForelderPartRolleSchema.options.map((rolle) => (
                                                <Radio key={rolle} value={rolle}>
                                                    {hentForelderRolleLabel(rolle)}
                                                </Radio>
                                            ))}
                                        </Stack>
                                    </RadioGroup>
                                    {handling?.(forelder, index)}
                                </VStack>
                            )}
                        </RollePersonKort>
                    );
                })}
            </HGrid>
        </SkjemaSeksjon>
    );
}
