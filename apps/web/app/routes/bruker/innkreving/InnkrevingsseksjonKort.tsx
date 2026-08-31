import { Box, Heading, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

type Props = {
    title: string;
    children: ReactNode;
};

export function InnkrevingsseksjonKort({ title, children }: Props) {
    return (
        <Box borderColor="neutral-subtle" background="neutral-soft" padding="space-16" borderWidth="1" borderRadius="4">
            <VStack gap="space-8">
                <Heading size="small" level="2">
                    {title}
                </Heading>
                <Box
                    background="default"
                    borderColor="neutral-subtle"
                    padding="space-16"
                    borderWidth="1"
                    borderRadius="4"
                >
                    {children}
                </Box>
            </VStack>
        </Box>
    );
}
