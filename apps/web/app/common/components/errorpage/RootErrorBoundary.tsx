import type { LoggetFeil, NavUser } from "@bidrag/common";
import { LoggerService } from "@bidrag/common";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppLayout } from "~/common/header/AppLayout.tsx";
import { QueryClientWrapper } from "~/common/QueryClientWrapper";
import ErrorPage from "./ErrorPage.tsx";
import { type NormalisertFeil, normaliserFeil } from "./normaliserFeil";

type Props = { bruker: NavUser | null; bisysUrl?: string } & (
    | { error: unknown; children?: never }
    | { error?: undefined; children: ReactNode }
);

type State = { fangetFeil?: unknown };

/**
 * RootErrorBoundary fanger opp alle feil som skjer i React-komponenter under seg.
 */
export default class RootErrorBoundary extends Component<Props, State> {
    override state: State = {};

    /** Referansen til forrige loggede feil, for å unngå duplikat-logging ved re-render. */
    private loggetFeil?: unknown;

    /**
     * Memoiserer normalisert feil per feil-referanse, slik at logging (render)
     * og visning (lifecycle-metodene) garantert bruker samme resultat.
     */
    private normalisertFeilCache?: { error: unknown; feil: NormalisertFeil };

    static getDerivedStateFromError(error: unknown): State {
        return { fangetFeil: error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (errorInfo.componentStack) {
            (error as Error & { componentStack?: string }).componentStack = errorInfo.componentStack;
        }
        this.loggFeil(error);
    }

    override componentDidMount() {
        this.loggFeilFraProp();
    }

    override componentDidUpdate() {
        this.loggFeilFraProp();
    }

    private loggFeilFraProp() {
        if ("error" in this.props && this.props.error !== undefined) {
            this.loggFeil(this.props.error);
        }
    }

    /** Ren memoisering — trygg å kalle fra `render`, gjør ingen nettverkskall. */
    private normaliserFeilFor(error: unknown): NormalisertFeil {
        const cache = this.normalisertFeilCache;
        if (cache !== undefined && cache.error === error) {
            return cache.feil;
        }
        const feil = normaliserFeil(error);
        this.normalisertFeilCache = { error, feil };
        return feil;
    }

    private loggFeil(error: unknown) {
        // Samme feilobjekt kan trigge både componentDidCatch og en påfølgende
        // componentDidUpdate. Referansesammenligning er nok siden vi aldri
        // muterer inn et nytt objekt for samme feil.
        if (error === this.loggetFeil) {
            return;
        }
        this.loggetFeil = error;

        const feil = this.normaliserFeilFor(error);

        LoggerService.error(feil.message, this.tilLoggerFeilInput(feil), {
            message: feil.message,
            name: feil.name,
            status: feil.status,
            correlationId: feil.correlationId,
        });
    }

    private tilLoggerFeilInput(feil: NormalisertFeil): Error | LoggetFeil | undefined {
        if (feil.realError) {
            if (feil.componentStack) {
                (feil.realError as Error & { componentStack?: string }).componentStack = feil.componentStack;
            }
            return feil.realError;
        }
        if (feil.componentStack) {
            return { name: feil.name, message: feil.message, status: feil.status, componentStack: feil.componentStack };
        }
        return undefined;
    }

    override render() {
        const error =
            "error" in this.props && this.props.error !== undefined ? this.props.error : this.state.fangetFeil;

        if (error) {
            return (
                <QueryClientWrapper>
                    <AppLayout bruker={this.props.bruker} bisysUrl={this.props.bisysUrl}>
                        <ErrorPage feil={this.normaliserFeilFor(error)} />
                    </AppLayout>
                </QueryClientWrapper>
            );
        }

        return this.props.children;
    }
}
