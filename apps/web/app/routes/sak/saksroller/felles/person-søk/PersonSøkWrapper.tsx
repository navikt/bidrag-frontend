import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyLong, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import { type ReactNode, useId } from "react";
import SøkPerson from "./SøkPerson.tsx";

export interface PersonSøkInnholdProps {
    beskrivelse: string;
    søkeLabel: string;
    onPersonValgt: (person: PersonDto) => void;
    onQueryChange?: () => void;
    children?: ReactNode;
    resultat?: ReactNode;
}

export function PersonSøkInnhold({
    beskrivelse,
    søkeLabel,
    onPersonValgt,
    onQueryChange,
    children,
    resultat,
}: PersonSøkInnholdProps) {
    return (
        <VStack gap="space-16">
            <BodyLong size="small" textColor="subtle">
                {beskrivelse}
            </BodyLong>
            {children}
            {/* PersonSamhandlerSøk viser selv inline feilmelding ved mislykket søk; ikke dupliser den i resultat-slotten. */}
            <SøkPerson
                label={søkeLabel}
                personInformasjon={onPersonValgt}
                onQueryChange={onQueryChange}
                onError={onQueryChange}
                compact
            />
            {resultat}
        </VStack>
    );
}

export interface PersonSøkRammeProps {
    tittel: string;
    onAvbryt: () => void;
    ikon?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
}

/** Inline ramme for søk. Brukes der innholdet selv kan ligge i en modal. */
export default function PersonSøkWrapper({ tittel, onAvbryt, ikon, actions, children }: PersonSøkRammeProps) {
    const tittelId = useId();
    return (
        <Box
            role="region"
            aria-labelledby={tittelId}
            background="accent-soft"
            borderColor="accent"
            borderWidth="1"
            borderRadius="12"
            padding="space-16"
        >
            <VStack gap="space-16">
                <HStack gap="space-8" align="center" wrap={false}>
                    {ikon}
                    <Heading id={tittelId} level="3" size="small">
                        {tittel}
                    </Heading>
                </HStack>
                {children}
                <HStack gap="space-8">
                    {actions ?? (
                        <Button type="button" size="small" variant="tertiary" onClick={onAvbryt}>
                            Avbryt
                        </Button>
                    )}
                </HStack>
            </VStack>
        </Box>
    );
}
