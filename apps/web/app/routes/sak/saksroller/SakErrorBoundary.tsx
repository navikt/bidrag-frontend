import { TilgangsFeilError } from "@bidrag/api";
import { Alert, BodyLong, Box, Heading, Page } from "@navikt/ds-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

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
                    <Page.Block width="lg">
                        <Box padding="space-24">
                            <Alert variant="error">
                                <Heading level="3" size="small" spacing>
                                    Ingen tilgang
                                </Heading>
                                <BodyLong spacing>
                                    Du har ikke tilgang til sak {this.props.saksnummer}. Dette kan skyldes
                                    diskresjonskode eller manglende rettigheter.
                                </BodyLong>
                            </Alert>
                        </Box>
                    </Page.Block>
                );
            }

            if (isSakNotFound) {
                return (
                    <Page.Block width="lg">
                        <Box padding="space-24">
                            <Alert variant="error">
                                <Heading level="3" size="small" spacing>
                                    Sak ikke funnet
                                </Heading>
                                <BodyLong spacing>Fant ingen sak med saksnummer {this.props.saksnummer}</BodyLong>
                            </Alert>
                        </Box>
                    </Page.Block>
                );
            }

            return (
                <Page.Block width="lg">
                    <Box padding="space-24">
                        <Alert variant="error">
                            <Heading level="3" size="small" spacing>
                                Feil under lasting av sak
                            </Heading>
                            <BodyLong spacing>
                                Kunne ikke laste sak {this.props.saksnummer}. Vennligst prøv igjen senere.
                            </BodyLong>
                        </Alert>
                    </Box>
                </Page.Block>
            );
        }

        return this.props.children;
    }
}
