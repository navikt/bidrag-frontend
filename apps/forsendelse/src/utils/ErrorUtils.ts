import type { AxiosError } from "axios";

export function parseErrorMessageFromAxiosError(error?: AxiosError): string | undefined {
    return error.response?.headers?.warning;
}
