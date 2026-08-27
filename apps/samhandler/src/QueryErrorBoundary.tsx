import { Loader, Stack } from "@navikt/ds-react";
import { type ReactNode, Suspense } from "react";

export const QueryErrorWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <Suspense
            fallback={
                <Stack justify={"center"} overflow={"hidden"}>
                    <Loader size="xsmall" title="Henter.." variant="interaction" />
                </Stack>
            }
        >
            {children}
        </Suspense>
    );
};
