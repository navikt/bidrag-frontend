import type { ApiError } from "@bidrag/types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/**
 * Henter Azure AD OBO-token fra Wonderwall-header og videresender til backend.
 *
 * 🔴 RØDZONE: Implementer OBO-exchange her.
 * Wonderwall injiserer `Authorization: Bearer <azureAdToken>` i inngående request.
 * Dette tokenet må exchangees til et token med riktig audience for backend-tjenesten
 * via Azure AD OBO-flow (on-behalf-of) FØR det sendes til backend.
 *
 * Se: https://docs.nais.io/auth/azure-ad/how-to/consume-obo/
 */
export async function getOnBehalfOfToken(_incomingAuthHeader: string, _targetApp: string): Promise<string> {
    // TODO: Implementer Azure AD OBO-token-exchange
    // 1. Parse Bearer-token fra incomingAuthHeader
    // 2. Kall Azure AD /token-endepunkt med grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
    // 3. Returner access_token med audience for targetApp
    throw new Error("OBO-token-exchange er ikke implementert");
}

export async function fetchJson<T>(url: string, token: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "Nav-Consumer-Id": "bidrag-frontend",
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error: ApiError = {
                status: response.status,
                message: `HTTP ${response.status}: ${response.statusText}`,
            };
            return { ok: false, error };
        }

        const data = (await response.json()) as T;
        return { ok: true, data };
    } catch (err) {
        const error: ApiError = {
            status: 0,
            message: err instanceof Error ? err.message : "Ukjent feil",
        };
        return { ok: false, error };
    }
}

