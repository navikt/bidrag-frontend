import { PersonPlusIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, BodyShort, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

export type Personforslag = {
    navn: string;
    fødselsdato?: string;
    onBruk: () => void;
};

type Props = {
    tittel: string;
    beskrivelse: string;
    variant?: "warning" | "success" | "info";
    forslag?: Personforslag[];
    children?: ReactNode;
};

export default function ForeslåPersonPanel({ tittel, beskrivelse, variant = "info", forslag = [], children }: Props) {
    return (
        <Alert variant={variant} size="small">
            <VStack gap="space-12">
                <div>
                    <Heading level="3" size="small" spacing>
                        {tittel}
                    </Heading>
                    <BodyShort size="small">{beskrivelse}</BodyShort>
                </div>

                {forslag.length <= 1 && (
                    <HStack gap="space-8" wrap>
                        {forslag[0] && (
                            <Button type="button" size="small" onClick={forslag[0].onBruk}>
                                Bruk {forslag[0].navn}
                            </Button>
                        )}
                        {children}
                    </HStack>
                )}

                {forslag.length > 1 && (
                    <Box
                        background="raised"
                        borderColor="neutral-subtleA"
                        borderWidth="1"
                        borderRadius="12"
                        padding="space-16"
                    >
                        <Heading level="4" size="xsmall" spacing>
                            Foreslåtte personer ({forslag.length})
                        </Heading>
                        <BodyLong size="small" textColor="subtle" spacing>
                            Velg en foreslått person for å bruke den direkte
                        </BodyLong>
                        <VStack gap="space-8">
                            {forslag.map((personforslag) => (
                                <Button
                                    key={personforslag.navn}
                                    type="button"
                                    variant="tertiary"
                                    size="small"
                                    className="w-full justify-start"
                                    onClick={personforslag.onBruk}
                                >
                                    <HStack gap="space-4" align="center">
                                        <PersonPlusIcon aria-hidden className="shrink-0" />
                                        <BodyLong size="small">
                                            {personforslag.navn}
                                            {personforslag.fødselsdato && ` (${personforslag.fødselsdato})`}
                                        </BodyLong>
                                    </HStack>
                                </Button>
                            ))}
                        </VStack>
                    </Box>
                )}
                {forslag.length > 1 && children}
            </VStack>
        </Alert>
    );
}
