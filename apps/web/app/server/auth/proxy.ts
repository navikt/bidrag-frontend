import { getApiConfig } from "~/api.env.ts";
import { authTokenContext } from "~/server/auth/auth.context.ts";
import { navLogger } from "~/server/logger/navLogger.ts";
import type { Route } from "./+types/proxy.ts";
import { getOnBehalfOfToken } from "./auth.utils.server.ts";

const correlationIdHeader = "X-Correlation-ID";

export function generateCorrelationId(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(12));
    const base64 = btoa(String.fromCharCode(...randomBytes));

    return base64.replaceAll("+", "-").replaceAll("/", "_");
}

function responseWithCorrelationId(response: Response, correlationId: string): Response {
    const headers = new Headers(response.headers);
    headers.set(correlationIdHeader, correlationId);

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

async function proxyRequest(request: Request, app: string, context: Route.LoaderArgs["context"]): Promise<Response> {
    const correlationId = request.headers.get(correlationIdHeader) ?? generateCorrelationId();
    const authToken = context.get(authTokenContext);
    if (!authToken) {
        throw new Response("Unauthorized", {
            status: 401,
            headers: { [correlationIdHeader]: correlationId },
        });
    }

    const apiConfig = getApiConfig(app);
    const oboToken = await getOnBehalfOfToken(authToken, apiConfig.audience);

    // Bygg backend-URL: behold path etter /proxy/:app, legg til base-URL sin path
    const incomingUrl = new URL(request.url);
    const subPath = incomingUrl.pathname.replace(`/proxy/${app}`, "");

    const baseUrl = new URL(apiConfig.url);
    const backendUrl = new URL(baseUrl.pathname.replace(/\/$/, "") + subPath + incomingUrl.search, baseUrl.origin);
    // Kopier headers fra original request, bytt ut Authorization
    const headers = new Headers(request.headers);
    headers.set(correlationIdHeader, correlationId);
    headers.set("Authorization", `Bearer ${oboToken}`);
    headers.delete("host");

    const backendResponse = await fetch(backendUrl.toString(), {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        duplex: "half",
    } as RequestInit);

    navLogger.debug(
        { app, callId: correlationId, method: request.method, status: backendResponse.status },
        "Proxy request completed",
    );

    return responseWithCorrelationId(backendResponse, correlationId);
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
    return proxyRequest(request, params.app, context);
}

export async function action({ params, request, context }: Route.ActionArgs) {
    return proxyRequest(request, params.app, context);
}
