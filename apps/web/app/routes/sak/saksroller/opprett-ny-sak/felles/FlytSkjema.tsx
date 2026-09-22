import { Box, VStack } from "@navikt/ds-react";
import type { ComponentProps, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
    onSubmit: NonNullable<ComponentProps<typeof VStack>["onSubmit"]>;
}>;

export default function FlytSkjema({ children, onSubmit }: Props) {
    return (
        <Box asChild background="sunken">
            <VStack as="form" onSubmit={onSubmit} gap="space-16" padding="space-12">
                {children}
            </VStack>
        </Box>
    );
}
