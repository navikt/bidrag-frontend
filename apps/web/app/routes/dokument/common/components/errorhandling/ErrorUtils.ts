import type { ApiResponse } from "../../../types/api/ApiResponse";
import type CustomError from "../../../types/api/CustomError";
export function showErrorPage(error: CustomError) {
    window.showErrorPage(error);
}

export function isApiResponse(value: any): value is ApiResponse {
    return "data" in value && "status" in value;
}
