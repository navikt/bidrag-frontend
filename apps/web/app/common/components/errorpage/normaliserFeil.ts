import type { ProblemDetail } from "@bidrag/api";
import { ApiError, CustomError, correlationIdHeader, generateCorrelationId } from "@bidrag/common";
import { isAxiosError } from "axios";
import { type ErrorResponse, isRouteErrorResponse } from "react-router";

export type NormalisertFeil = {
    message: string;
    /** `Error.name`, eller en syntetisk verdi for ikke-Error-tilfeller. */
    name: string;
    status: number;
    /** Kun satt når vi har en ekte stacktrace å vise/logge. */
    stackTrace?: string;
    /** Kun satt når vi har en ekte `Error`-instans å gi videre til Faro/pino sin stacktrace-parsing. */
    realError?: Error;
    /** Satt når feilen ble fanget av en React error boundary (componentDidCatch). */
    componentStack?: string;
    correlationId: string;
};

function getAxiosCorrelationId(error: unknown): string | undefined {
    if (!isAxiosError(error)) {
        return undefined;
    }
    const correlationId = error.response?.headers[correlationIdHeader.toLowerCase()];
    return typeof correlationId === "string" && correlationId ? correlationId : undefined;
}

function finnComponentStack(error: unknown): string | undefined {
    const componentStack = (error as { componentStack?: unknown } | null)?.componentStack;
    return typeof componentStack === "string" && componentStack ? componentStack : undefined;
}

export function normaliserFeil(error: unknown): NormalisertFeil {
    if (isRouteErrorResponse(error)) {
        return normaliserRouteErrorResponse(error);
    }

    if (isAxiosError<ProblemDetail>(error)) {
        return normaliserAxiosError(error);
    }

    if (error instanceof CustomError) {
        return normaliserCustomError(error);
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
            status: 500,
            stackTrace: error.stack,
            realError: error,
            componentStack: finnComponentStack(error),
            correlationId: getAxiosCorrelationId(error) ?? generateCorrelationId(),
        };
    }

    if (typeof error === "string" && error) {
        return { message: error, name: "Error", status: 500, correlationId: generateCorrelationId() };
    }

    return { message: "Ukjent feil", name: "UnknownError", status: 500, correlationId: generateCorrelationId() };
}

function normaliserRouteErrorResponse(error: ErrorResponse): NormalisertFeil {
    // `.error` er et privat felt på `ErrorResponseImpl`, ikke del av den
    // offentlige `ErrorResponse`-typen — men det er her React Router bevarer
    // den opprinnelige feilen (med stacktrace) fra en uventet loader/action-feil.
    const bevartFeil = (error as unknown as { error?: unknown }).error;
    if (bevartFeil !== undefined) {
        return normaliserFeil(bevartFeil);
    }

    const dataSomTekst = typeof error.data === "string" && error.data ? error.data : undefined;
    const message = dataSomTekst ?? error.statusText ?? `Feil ${error.status}`;

    return {
        message,
        name: "RouteErrorResponse",
        status: error.status,
        componentStack: finnComponentStack(error),
        correlationId: generateCorrelationId(),
    };
}

function normaliserAxiosError(error: import("axios").AxiosError<ProblemDetail>): NormalisertFeil {
    const problemDetail = error.response?.data;
    const message = (typeof problemDetail?.detail === "string" && problemDetail.detail) || error.message;
    const status = problemDetail?.status ?? error.response?.status ?? 500;

    return {
        message,
        name: error.name,
        status,
        stackTrace: error.stack,
        realError: error,
        componentStack: finnComponentStack(error),
        correlationId: getAxiosCorrelationId(error) ?? generateCorrelationId(),
    };
}

function normaliserCustomError(error: CustomError): NormalisertFeil {
    // ApiError sitt `.error`-felt (opprinnelig wrappet feil) brukes kun som
    // reserve når CustomError sine egne felter mangler.
    const bevartFeil = error instanceof ApiError ? error.error : undefined;
    const bevartNormalisert = bevartFeil ? normaliserFeil(bevartFeil) : undefined;

    return {
        message: error.message || bevartNormalisert?.message || "Ukjent feil",
        name: error.name,
        status: error.status,
        stackTrace: error.stack ?? bevartFeil?.stack,
        realError: error,
        componentStack: finnComponentStack(error),
        correlationId: error.correlationId || bevartNormalisert?.correlationId || generateCorrelationId(),
    };
}
