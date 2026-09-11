import type { ProblemDetail } from "@bidrag/api";
import { ApiError, CustomError, correlationIdHeader, generateCorrelationId, type LoggetFeil } from "@bidrag/common";
import { type AxiosError, type AxiosHeaders, isAxiosError } from "axios";
import { type ErrorResponse, isRouteErrorResponse } from "react-router";

export type NormalisertFeil = LoggetFeil & {
    correlationId: string;
};

function getAxiosCorrelationId(error: unknown): string | undefined {
    if (!isAxiosError(error)) {
        return undefined;
    }
    const responseHeaders = error.response?.headers as AxiosHeaders;
    const correlationId = responseHeaders.get(correlationIdHeader);
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

    if (isAxiosError(error)) {
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
            stack: error.stack,
            componentStack: finnComponentStack(error),
            correlationId: getAxiosCorrelationId(error) ?? generateCorrelationId(),
        };
    }

    if (typeof error === "string" && error) {
        return { message: error, name: "StringError", status: 200, correlationId: generateCorrelationId() };
    }

    return { message: "Ukjent feil", name: "UnknownError", status: 500, correlationId: generateCorrelationId() };
}

function normaliserRouteErrorResponse(error: ErrorResponse): NormalisertFeil {
    // `.error` er et privat felt på `ErrorResponseImpl`, ikke del av den
    // offentlige `ErrorResponse`-typen — men det er her React Router bevarer
    // den opprinnelige feilen (med stacktrace) fra en uventet loader/action-feil.
    const ukjentFeil = (error as unknown as { error?: unknown }).error;
    const bevartFeil: Error | undefined = ukjentFeil instanceof Error ? ukjentFeil : undefined;

    const dataSomTekst = typeof error.data === "string" && error.data ? error.data : undefined;
    const message = dataSomTekst ?? bevartFeil?.message ?? error.statusText ?? `Feil ${error.status}`;

    return {
        message,
        name: "RouteErrorResponse",
        status: error.status,
        stack: bevartFeil?.stack,
        componentStack: finnComponentStack(error),
        correlationId: generateCorrelationId(),
    };
}

function normaliserAxiosError(error: AxiosError<ProblemDetail>): NormalisertFeil {
    const problemDetail = error.response?.data;
    const message = (typeof problemDetail?.detail === "string" && problemDetail.detail) || error.message;
    const status = problemDetail?.status ?? error.response?.status ?? 500;
    const type = problemDetail?.type ?? error.name ?? "AxiosError";

    return {
        message,
        name: type,
        status,
        stack: error.stack,
        componentStack: finnComponentStack(error),
        correlationId: getAxiosCorrelationId(error) ?? generateCorrelationId(),
    };
}

function normaliserCustomError(error: CustomError): NormalisertFeil {
    const bevartFeil = error instanceof ApiError ? error.error : undefined;
    const bevartNormalisert = bevartFeil ? normaliserFeil(bevartFeil) : undefined;

    return {
        message: error.message || bevartNormalisert?.message || "Ukjent feil",
        name: error.name,
        status: error.status,
        stack: error.stack ?? bevartFeil?.stack,
        componentStack: finnComponentStack(error),
        correlationId: error.correlationId || bevartNormalisert?.correlationId || generateCorrelationId(),
    };
}
