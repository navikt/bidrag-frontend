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
                {foreldre.map((forelder, index) => (
                    <RollePersonKort
                        key={index}
                        person={{ ...forelder, rolle: forelder.rolle ?? undefined }}
                        tittel={`Forelder ${index + 1}`}
                        førInnhold={
                            <ForelderSøk
                                forelder={forelder}
                                index={index}
                                kanRegistrere={kanRegistrere(index)}
                                onPersonValgt={onPersonValgt}
                                onSettUkjent={onSettUkjent}
                            />
                        }
                    >
                        <ForelderRollevalg
                            forelder={forelder}
                            index={index}
                            personfeil={personfeil}
                            rollefeil={rollefeil}
                            onVelgRolle={onVelgRolle}
                            handling={handling}
                        />
                    </RollePersonKort>
                ))}
            </HGrid>
        </SkjemaSeksjon>
    );
}

type ForelderProps = { forelder: ForelderMedRolle; index: number };

function ForelderSøk({
    forelder,
    index,
    kanRegistrere,
    onPersonValgt,
    onSettUkjent,
}: ForelderProps & Pick<Props, "onPersonValgt" | "onSettUkjent"> & { kanRegistrere: boolean }) {
    if (!kanRegistrere || !onPersonValgt) return null;
    const nummer = index + 1;
    const kanSettesUkjent = forelder.erKjent !== false && onSettUkjent;

    return (
        <VStack gap="space-12">
            <SøkPerson
                label={`Søk etter forelder ${nummer}`}
                personInformasjon={(person) => onPersonValgt(person, index)}
                compact
            />
            {kanSettesUkjent && (
                <HStack>
                    <Button type="button" size="small" variant="secondary-neutral" onClick={() => onSettUkjent(index)}>
                        Registrer forelder {nummer} som ukjent
                    </Button>
                </HStack>
            )}
        </VStack>
    );
}

function ForelderRollevalg({
    forelder,
    index,
    personfeil,
    rollefeil,
    onVelgRolle,
    handling,
}: ForelderProps & Pick<Props, "personfeil" | "rollefeil" | "onVelgRolle" | "handling">) {
    if (typeof forelder.erKjent !== "boolean") return null;
    const feil = personfeil?.[index];

    return (
        <VStack gap="space-12">
            {feil && <Alert variant="error">{feil}</Alert>}
            <RadioGroup
                legend={`Velg rolle for ${forelder.navn || `forelder ${index + 1}`}`}
                size="small"
                value={forelder.rolle ?? ""}
                onChange={(rolle) => onVelgRolle(index, rolle as ForelderPartRolle)}
                error={rollefeil?.[index]}
            >
                <Stack gap="space-0 space-24" direction={{ xs: "column", sm: "row" }} wrap={false}>
                    {ForelderPartRolleSchema.options.map((rolle) => (
                        <Radio key={rolle} value={rolle}>
                            {hentForelderRolleLabel(rolle)}
                        </Radio>
                    ))}
                </Stack>
            </RadioGroup>
            {handling?.(forelder, index)}
        </VStack>
    );
}
