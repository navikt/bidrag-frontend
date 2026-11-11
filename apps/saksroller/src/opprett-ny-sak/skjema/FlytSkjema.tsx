import { VStack } from "@navikt/ds-react";
import type { ComponentProps, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
    onSubmit: NonNullable<ComponentProps<typeof VStack>["onSubmit"]>;
    disabled?: boolean;
    id?: string;
}>;

export default function FlytSkjema({ children, onSubmit, disabled = false, id }: Props) {
    return (
        <VStack as="form" id={id} onSubmit={onSubmit} gap="space-24" aria-busy={disabled} inert={disabled || undefined}>
            {children}
        </VStack>
    );
}
