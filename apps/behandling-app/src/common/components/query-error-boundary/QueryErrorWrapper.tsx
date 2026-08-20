import { LoggerService } from "@bidrag/common";
import { Alert, BodyShort, Button, Heading, Loader } from "@navikt/ds-react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import text from "../../constants/texts";

export const QueryErrorWrapper = ({ children }) => {
    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary
                    onError={(error: Error) => {
                        LoggerService.error(
                            `Det skjedde en feil i bidrag-behandling skjermbildet ${error.message}`,
                            error,
                        );
                    }}
                    fallbackRender={({
                        error,
                        resetErrorBoundary,
                    }: {
                        error: Error;
                        resetErrorBoundary: () => void;
                    }) => (
                        <Alert variant="error">
                            <div>
                                <Heading spacing size="small" level="3">
                                    Det har skjedd en feil
                                </Heading>
                                <BodyShort size="small">Feilmelding: {error.message}</BodyShort>
                                <Button size="small" className="w-max mt-4" onClick={() => resetErrorBoundary()}>
                                    {text.refresh}
                                </Button>
                            </div>
                        </Alert>
                    )}
                    onReset={reset}
                >
                    <Suspense
                        fallback={
                            <div className="flex justify-center overflow-hidden">
                                <Loader size="3xlarge" title={text.loading} variant="interaction" />
                            </div>
                        }
                    >
                        {children}
                    </Suspense>
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    );
};
