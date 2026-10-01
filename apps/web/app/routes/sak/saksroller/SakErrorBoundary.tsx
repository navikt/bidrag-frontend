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
                    {[`${error.name}: ${error.message}`, error.stack, errorInfo?.componentStack]
                        .filter(Boolean)
                        .join("\n\n")}
                </BodyLong>
            </ExpansionCard.Content>
        </ExpansionCard>
    );
}

function SakFeilside({
    title,
    children,
    error,
    errorInfo,
}: {
    title: string;
    children: ReactNode;
    error?: Error;
    errorInfo?: ErrorInfo | null;
}) {
    return (
        <Page.Block width="lg">
            <Box padding="space-24">
                <GlobalAlert status="error" centered={false}>
                    <GlobalAlert.Header>
                        <GlobalAlert.Title as="h2">{title}</GlobalAlert.Title>
                    </GlobalAlert.Header>
                    <GlobalAlert.Content>{children}</GlobalAlert.Content>
                </GlobalAlert>
                {error && import.meta.env.DEV && (
                    <Box paddingBlock="space-16 space-0">
                        <TekniskeDetaljer error={error} errorInfo={errorInfo ?? null} />
                    </Box>
                )}
            </Box>
        </Page.Block>
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
        if (!this.state.error) {
            return this.props.children;
        }
        return <SakFeil error={this.state.error} errorInfo={this.state.errorInfo} saksnummer={this.props.saksnummer} />;
    }
}

function SakFeil({ error, errorInfo, saksnummer }: { error: Error; errorInfo: ErrorInfo | null; saksnummer: string }) {
    if (error instanceof TilgangsFeilError) {
        return (
            <SakFeilside title="Ingen tilgang">
                Du har ikke tilgang til sak {saksnummer}. Dette kan skyldes diskresjonskode eller manglende rettigheter.
            </SakFeilside>
        );
    }

    if (error.message.includes("Fant ikke sak")) {
        return <SakFeilside title="Sak ikke funnet">Fant ingen sak med saksnummer {saksnummer}</SakFeilside>;
    }

    return (
        <SakFeilside title="Feil under lasting av sak" error={error} errorInfo={errorInfo}>
            Kunne ikke laste sak {saksnummer}. Vennligst prøv igjen senere.
        </SakFeilside>
    );
}
