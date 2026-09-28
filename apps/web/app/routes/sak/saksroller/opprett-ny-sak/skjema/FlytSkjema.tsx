import { VStack } from "@navikt/ds-react";
import type { ComponentProps, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
    onSubmit: NonNullable<ComponentProps<typeof VStack>["onSubmit"]>;
    disabled?: boolean;
}>;

export default function FlytSkjema({ children, onSubmit, disabled = false }: Props) {
    return (
        <VStack as="form" onSubmit={onSubmit} gap="space-24" aria-busy={disabled} inert={disabled || undefined}>
            {children}
        </VStack>
    );
}
