import { SecureLoggerService } from "@bidrag/common";
import { type ProblemDetail, TilgangsFeilError } from "@bidrag/api";
import axios, { AxiosError } from "axios";




export async function withQueryErrorHandling<T>(
    queryName: string,
    fn: () => Promise<T>,
    context: Record<string, string | number | undefined> = {}
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        const axiosError = error as AxiosError;

        const status = axiosError?.response?.status;
        if (status === 403 || status === 401) {
            await SecureLoggerService.warn(`Ingen tilgang til ${queryName} for ${context}`);
            throw new TilgangsFeilError(`Du har ikke tilgang til ${queryName} for ${context}`);
        }
        // Sjekk om det er en ProblemDetail
        if (axios.isAxiosError<ProblemDetail>(error)) {
            if (error.response) {
                throw error.response.data;
            }
        }

        throw error;
    }
}
