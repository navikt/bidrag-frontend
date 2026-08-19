import { ApiResponse } from "../../../types/api/ApiResponse";
import CustomError from "../../../types/api/CustomError";
export function showErrorPage(error: CustomError) {
    window.showErrorPage(error);
}

export function isApiResponse(value: any): value is ApiResponse {
    return "data" in value && "status" in value;
}
