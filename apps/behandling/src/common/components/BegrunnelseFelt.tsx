import { Box } from "@navikt/ds-react";
import type { PropsWithChildren } from "react";

export default function BegrunnelseFeltWrapper({ children }: PropsWithChildren<unknown>) {
    return (
        <Box background="info-soft" borderRadius="4">
            {children}
        </Box>
    );
}
