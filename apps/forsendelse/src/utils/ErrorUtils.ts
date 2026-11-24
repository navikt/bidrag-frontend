import { isAxiosError } from "axios";

export function parseErrorMessageFromAxiosError(error?: unknown): string | undefined {
    if (isAxiosError(error)) {
        const warning = error.response?.headers?.warning;
        if (typeof warning === "string" && warning.trim().length > 0) {
            return warning;
        }
    }
    if (error instanceof Error && error.message?.trim().length > 0) {
        return error.message;
    }
    return undefined;
}

/**
 * Lager en brukerrettet feilmelding for en mislykket API-operasjon.
 */
export function formatApiErrorMessage(prefix: string, error: unknown): string {
    const details = parseErrorMessageFromAxiosError(error);
    return details ? `${prefix}: ${details}` : `${prefix}. Prøv igjen.`;
}
