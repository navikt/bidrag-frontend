import { Alert, BodyLong, Heading } from "@navikt/ds-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { TilgangsFeilError } from "@bidrag/api";

interface Props {
    children: ReactNode;
    saksnummer: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class SakErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Error caught in SakErrorBoundary:", error, errorInfo);
    }

    override render() {
        if (this.state.hasError && this.state.error) {
            const error = this.state.error;
            const isTilgangsfeil = error instanceof TilgangsFeilError;
            const isSakNotFound = error.message.includes("Fant ikke sak");

            if (isTilgangsfeil) {
                return (
                    <div className="max-w-5xl mx-auto p-6">
                        <Alert variant="error">
                            <Heading level="3" size="small" spacing>
                                Ingen tilgang
                            </Heading>
                            <BodyLong spacing>
                                Du har ikke tilgang til sak {this.props.saksnummer}. Dette kan skyldes diskresjonskode
                                eller manglende rettigheter.
                            </BodyLong>
                        </Alert>
                    </div>
                );
            }

            if (isSakNotFound) {
                return (
                    <div className="max-w-5xl mx-auto p-6">
                        <Alert variant="error">
                            <Heading level="3" size="small" spacing>
                                Sak ikke funnet
                            </Heading>
                            <BodyLong spacing>Fant ingen sak med saksnummer {this.props.saksnummer}</BodyLong>
                        </Alert>
                    </div>
                );
            }

            return (
                <div className="max-w-5xl mx-auto p-6">
                    <Alert variant="error">
                        <Heading level="3" size="small" spacing>
                            Feil under lasting av sak
                        </Heading>
                        <BodyLong spacing>
                            Kunne ikke laste sak {this.props.saksnummer}. Vennligst prøv igjen senere.
                        </BodyLong>
                    </Alert>
                </div>
            );
        }

        return this.props.children;
    }
}
