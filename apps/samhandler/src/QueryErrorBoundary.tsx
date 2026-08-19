import { Loader } from "@navikt/ds-react";
import { type ReactNode, Suspense } from "react";

export const QueryErrorWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center overflow-hidden">
                    <Loader size="xsmall" title="Henter.." variant="interaction" />
                </div>
            }
        >
            {children}
        </Suspense>
    );
};
