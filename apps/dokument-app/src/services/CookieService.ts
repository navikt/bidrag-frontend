import { DefaultRestService } from "@navikt/bidrag-ui-common";

import environment from "../environment";
import type ApiError from "../types/api/ApiError";
import type { ApiResponse } from "../types/api/ApiResponse";
export default class CookieService extends DefaultRestService {
    constructor() {
        super("self", environment.url.bidragDokumentUi + "api");
    }
    updateSessionAuthCookie(): Promise<ApiResponse<void> | ApiError> {
        return this.get("/set-cookie");
    }
}
