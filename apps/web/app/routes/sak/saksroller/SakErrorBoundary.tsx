import { TilgangsFeilError } from "@bidrag/api";
import { BodyLong, Box, ExpansionCard, GlobalAlert, Page } from "@navikt/ds-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

function TekniskeDetaljer({ error, errorInfo }: { error: Error; errorInfo: ErrorInfo | null }) {
    return (
        <ExpansionCard aria-label="Tekniske detaljer" size="small">
            <ExpansionCard.Header>
                <ExpansionCard.Title size="small">Tekniske detaljer</ExpansionCard.Title>
            </ExpansionCard.Header>
            <ExpansionCard.Content>
                <BodyLong as="pre" size="small" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {error.name}: {error.message}
                    {import.meta.env.DEV && error.stack ? `\n\n${error.stack}` : ""}
                    {import.meta.env.DEV && errorInfo?.componentStack ? `\n${errorInfo.componentStack}` : ""}
                </BodyLong>
            </ExpansionCard.Content>
        </ExpansionCard>
    );
}

interface Props {
    children: ReactNode;
    saksnummer: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class SakErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    override componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
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
                            <GlobalAlert status="error" centered={false}>
                                <GlobalAlert.Header>
                                    <GlobalAlert.Title as="h2">Ingen tilgang</GlobalAlert.Title>
                                </GlobalAlert.Header>
                                <GlobalAlert.Content>
                                    Du har ikke tilgang til sak {this.props.saksnummer}. Dette kan skyldes
                                    diskresjonskode eller manglende rettigheter.
                                </GlobalAlert.Content>
                            </GlobalAlert>
                        </Box>
                    </Page.Block>
                );
            }

            if (isSakNotFound) {
                return (
                    <Page.Block width="lg">
                        <Box padding="space-24">
                            <GlobalAlert status="error" centered={false}>
                                <GlobalAlert.Header>
                                    <GlobalAlert.Title as="h2">Sak ikke funnet</GlobalAlert.Title>
                                </GlobalAlert.Header>
                                <GlobalAlert.Content>
                                    Fant ingen sak med saksnummer {this.props.saksnummer}
                                </GlobalAlert.Content>
                            </GlobalAlert>
                        </Box>
                    </Page.Block>
                );
            }

            return (
                <Page.Block width="lg">
                    <Box padding="space-24">
                        <GlobalAlert status="error" centered={false}>
                            <GlobalAlert.Header>
                                <GlobalAlert.Title as="h2">Feil under lasting av sak</GlobalAlert.Title>
                            </GlobalAlert.Header>
                            <GlobalAlert.Content>
                                Kunne ikke laste sak {this.props.saksnummer}. Vennligst prøv igjen senere.
                            </GlobalAlert.Content>
                        </GlobalAlert>
                        {import.meta.env.DEV && (
                            <Box paddingBlock="space-16 space-0">
                                <TekniskeDetaljer error={error} errorInfo={this.state.errorInfo} />
                            </Box>
                        )}
                    </Box>
                </Page.Block>
            );
        }

        return this.props.children;
    }
}
