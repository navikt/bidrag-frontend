import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonPlusIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, BodyShort, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import SøkPerson from "../components/SøkPerson.tsx";

type Forslag = {
    ident?: string;
    navn: string;
    fødselsdato?: string;
    onBruk?: () => void;
};

type Props = {
    tittel: string;
    beskrivelse: string;
    variant?: "warning" | "success" | "info";
    /** Enkel foreslått person — vises som "Bruk {navn}"-knapp */
    forslagNavn?: string;
    onBrukForslag?: () => void;
    /** Flere foreslåtte personer — vises som individuelle "Bruk {navn}"-knapper */
    forslagListe?: Forslag[];
    onVelgPerson: (person: PersonDto) => void;
    onError?: (feil: string) => void;
    søkLabel?: string;
};

export default function ForeslåPersonPanel({
    tittel,
    beskrivelse,
    variant = "info",
    forslagNavn,
    onBrukForslag,
    forslagListe,
    onVelgPerson,
    onError,
    søkLabel = "Søk etter person",
}: Props) {
    const [visSøk, setVisSøk] = useState(false);
    const harFlereForslag = Array.isArray(forslagListe) && forslagListe.length > 0;
    const harEnkeltForslag = !!forslagNavn && !!onBrukForslag && !harFlereForslag;

    if (visSøk) {
        return <SøkPerson label={søkLabel} personInformasjon={onVelgPerson} onError={onError} />;
    }

    return (
        <Alert variant={variant} size="small">
            <VStack gap="space-12">
                <div>
                    <Heading level="3" size="small" spacing>
                        {tittel}
                    </Heading>
                    <BodyShort size="small">{beskrivelse}</BodyShort>
                </div>

                {!harFlereForslag && (
                    <HStack gap="space-8" wrap>
                        {harEnkeltForslag && (
                            <Button type="button" size="small" onClick={onBrukForslag}>
                                Bruk {forslagNavn}
                            </Button>
                        )}
                        <Button type="button" size="small" onClick={() => setVisSøk(true)}>
                            Velg annen person
                        </Button>
                    </HStack>
                )}

                {harFlereForslag && (
                    <Box
                        background="raised"
                        borderColor="neutral-subtleA"
                        borderWidth="1"
                        borderRadius="12"
                        padding="space-16"
                    >
                        <Heading level="4" size="xsmall" spacing>
                            Foreslåtte personer ({forslagListe.length})
                        </Heading>
                        <BodyLong size="small" textColor="subtle" spacing>
                            Velg en foreslått person for å bruke den direkte
                        </BodyLong>
                        <VStack gap="space-8">
                            {forslagListe.map((forslag) => (
                                <Button
                                    key={forslag.ident ?? forslag.navn}
                                    type="button"
                                    variant="tertiary"
                                    size="small"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        if (forslag.onBruk) {
                                            forslag.onBruk();
                                            return;
                                        }
                                        if (!forslag.ident) return;
                                        onVelgPerson({
                                            ident: forslag.ident,
                                            visningsnavn: forslag.navn,
                                            fødselsdato: forslag.fødselsdato,
                                        });
                                    }}
                                >
                                    <HStack gap="space-4" align="center">
                                        <PersonPlusIcon aria-hidden className="shrink-0" />
                                        <BodyLong size="small">
                                            {forslag.navn}
                                            {forslag.fødselsdato && ` (${forslag.fødselsdato})`}
                                        </BodyLong>
                                    </HStack>
                                </Button>
                            ))}
                        </VStack>
                    </Box>
                )}
            </VStack>
        </Alert>
    );
}
