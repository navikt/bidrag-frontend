import { LoggerService } from "@bidrag/common";
import { FaroErrorBoundary } from "@grafana/faro-react";
import { BodyShort, Button, Loader, VStack } from "@navikt/ds-react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode, Suspense } from "react";

export const QueryErrorWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <FaroErrorBoundary
                    onError={(error) => {
                        LoggerService.error(
                            `Det skjedde en feil i bidrag-behandling skjermbildet ${error.message}`,
                            error,
                        );
                    }}
                    fallback={(_, resetErrorBoundary) => (
                        <VStack>
                            <BodyShort size="small">Det har skjedd en feil ved henting</BodyShort>
                            <Button size="small" className="w-max mt-4" onClick={() => resetErrorBoundary()}>
                                Last på nytt
                            </Button>
                        </VStack>
                    )}
                    onReset={reset}
                >
                    <Suspense
                        fallback={
                            <div className="flex justify-center overflow-hidden">
                                <Loader size="xsmall" title="Henter.." variant="interaction" />
                            </div>
                        }
                    >
                        {children}
                    </Suspense>
                </FaroErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    );
};
