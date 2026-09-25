import { BodyLong, Box, Heading, HStack, VStack } from "@navikt/ds-react";
import type { PropsWithChildren, ReactNode } from "react";

type SkjemaSeksjonProps = PropsWithChildren<{
    tittel: string;
    beskrivelse?: string;
    handling?: ReactNode;
}>;

export default function SkjemaSeksjon({ tittel, beskrivelse, handling, children }: SkjemaSeksjonProps) {
    return (
        <Box asChild background="sunken" borderRadius="12" padding="space-12">
            <section>
                <VStack gap="space-16">
                    <HStack align="start" justify="space-between" gap="space-16" wrap={false}>
                        <VStack gap="space-4" minWidth="0">
                            <Heading level="2" size="medium">
                                {tittel}
                            </Heading>
                            {beskrivelse && (
                                <BodyLong size="small" textColor="subtle">
                                    {beskrivelse}
                                </BodyLong>
                            )}
                        </VStack>
                        {handling}
                    </HStack>
                    <VStack gap="space-16">{children}</VStack>
                </VStack>
            </section>
        </Box>
    );
}

export function SkjemaSeksjonKort({
    children,
    variant = "default",
}: PropsWithChildren<{ variant?: "default" | "warning" }>) {
    return (
        <Box
            background={variant === "warning" ? "warning-soft" : "raised"}
            borderColor={variant === "warning" ? "warning" : "neutral-subtleA"}
            borderWidth="1"
            borderRadius="12"
            padding="space-16"
        >
            {children}
        </Box>
    );
}
