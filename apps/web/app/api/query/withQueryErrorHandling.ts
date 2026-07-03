import { type ProblemDetail, TilgangsFeilError } from "@bidrag/api";
import { ApiError, SecureLoggerService } from "@bidrag/common";
import axios, { type AxiosError } from "axios";

export async function withQueryErrorHandling<T>(
    queryName: string,
    fn: () => Promise<T>,
    context: Record<string, string | number | undefined> = {},
    notFoundValue?: T,
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        const axiosError = error as AxiosError;

        const status = axiosError?.response?.status;
        if (status === 403 || status === 401) {
            await SecureLoggerService.warn(
                `Ingen tilgang til ${queryName} for ${context}`,
            );
            throw new TilgangsFeilError(
                `Du har ikke tilgang til ${queryName} for ${context}`,
            );
        }
        if (status === 404 && notFoundValue !== undefined) {
            return notFoundValue;
        }
        // Sjekk om det er en ProblemDetail
        if (axios.isAxiosError<ProblemDetail>(error)) {
            if (error.response) {
                const problemDetail = error.response.data;
                throw new ApiError(
                    problemDetail?.detail ?? `Feil ved kall til ${queryName}`,
                    error.stack ?? "",
                    undefined,
                    problemDetail?.status ?? error.response.status,
                    error,
                );
            }
        }

        throw error;
    }
}
