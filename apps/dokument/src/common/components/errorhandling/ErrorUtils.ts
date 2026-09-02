import { LoggerService } from "@bidrag/common";

import type { ApiResponse } from "../../../types/api/ApiResponse";
import type CustomError from "../../../types/api/CustomError";

/**
 * Den frittstående bidrag-dokument-ui kalte `window.showErrorPage` som ble satt opp av
 * bidrag-ui-skallet. I bidrag-frontend finnes ikke den globale funksjonen; feilen logges
 * derfor til serveren og kastes videre slik at feilgrensen i apps/web viser feilsiden.
 */
export function showErrorPage(error: CustomError | Error): never {
    LoggerService.error(error?.message ?? "Ukjent feil", error instanceof Error ? error : new Error(String(error)));
    throw error;
}

export function isApiResponse(value: any): value is ApiResponse {
    return "data" in value && "status" in value;
}
