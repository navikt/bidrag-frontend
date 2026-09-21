import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, BodyShort, Box, Button, Heading, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    tittel: string;
    beskrivelse: string;
    variant: "warning" | "success";
    velgAnnenMotpart: () => void;
    settMotpartUkjent: () => void;
    foreslåttMotpartNavn?: string;
    brukForeslåttMotpart?: () => void;
};

export default function MotpartVelger({
    form,
    tittel,
    beskrivelse,
    variant,
    velgAnnenMotpart,
    settMotpartUkjent,
    foreslåttMotpartNavn,
    brukForeslåttMotpart,
}: Props) {
    const [visMotpartInfoPanel, setVisMotpartInfoPanel] = useState(false);
    const motpart = form.watch("motpart");

    const visningsnavn = motpart?.erKjent ? `${motpart.navn} (${motpart.ident})` : "Ukjent";
    const harForeslåttMotpart = !!foreslåttMotpartNavn && !!brukForeslåttMotpart;

    const håndterBrukForeslått = () => {
        if (!brukForeslåttMotpart) return;

        setVisMotpartInfoPanel(true);
        brukForeslåttMotpart();
    };

    const håndterVelgAnnen = () => {
        setVisMotpartInfoPanel(true);
        velgAnnenMotpart();
    };

    const håndterFjernMotpart = () => {
        setVisMotpartInfoPanel(false);
        settMotpartUkjent();
    };

    return (
        <div>
            {!visMotpartInfoPanel && (
                <Alert variant={variant} size="small">
                    <VStack gap="space-12">
                        <div>
                            <Heading level="3" size="small" spacing>
                                {tittel}
                            </Heading>
                            <BodyShort size="small">{beskrivelse}</BodyShort>
                        </div>

                        <HStack gap="space-8" wrap>
                            {harForeslåttMotpart && (
                                <Button type="button" size="small" onClick={håndterBrukForeslått}>
                                    Bruk {foreslåttMotpartNavn}
                                </Button>
                            )}

                            <Button type="button" size="small" onClick={håndterVelgAnnen}>
                                Velg annen person
                            </Button>
                        </HStack>
                    </VStack>
                </Alert>
            )}

            {visMotpartInfoPanel && (
                <Box
                    asChild
                    background="success-moderate"
                    borderWidth="1"
                    borderColor="success-strong"
                    borderRadius="8"
                >
                    <HStack align="center" justify="space-between" marginBlock="space-16 space-0" padding="space-12">
                        <HStack align="center" gap="space-12">
                            <PersonIcon fontSize="1.5rem" aria-hidden className="text-ax-success-700" />
                            <BodyLong size="small" weight="semibold">
                                Motpart: {visningsnavn}
                            </BodyLong>
                        </HStack>
                        <Button
                            type="button"
                            size="xsmall"
                            variant="secondary"
                            onClick={håndterFjernMotpart}
                            icon={<XMarkIcon title="Fjern motpart" />}
                        />
                    </HStack>
                </Box>
            )}
        </div>
    );
}
