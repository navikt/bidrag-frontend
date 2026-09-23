import { VStack } from "@navikt/ds-react";
import type { ComponentProps, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
    onSubmit: NonNullable<ComponentProps<typeof VStack>["onSubmit"]>;
}>;

export default function FlytSkjema({ children, onSubmit }: Props) {
    return (
        <VStack as="form" onSubmit={onSubmit} gap="space-24">
            {children}
        </VStack>
    );
}
