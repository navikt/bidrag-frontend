import { correlationIdHeader, generateCorrelationId } from "@bidrag/common";
import { getApiConfig } from "~/api.env.ts";
import { authTokenContext } from "~/server/auth/auth.context.ts";
import { hentRequestKontekst } from "~/server/logger/loggerContext.ts";
import { navLogger } from "~/server/logger/navLogger.ts";
import type { Route } from "./+types/proxy.ts";
import { getOnBehalfOfToken } from "./auth.utils.server.ts";

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
    // Middleware har allerede satt ID-en. Fallback er kun en sikring for kall utenom kjeden.
    const correlationId = hentRequestKontekst().correlationId ?? generateCorrelationId();
    const authToken = context.get(authTokenContext);
    if (!authToken) {
        navLogger.warn({ app }, "Proxy-kall avvist uten gyldig token");

        throw new Response("Unauthorized", {
            status: 401,
            headers: { [correlationIdHeader]: correlationId },
        });
    }

    try {
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
        const status = backendResponse.status;
        if (status >= 500) {
            navLogger.error(
                { app, method: request.method, status, path: subPath },
                "Proxy-kall fullført med serverfeil",
            );
        } else if (status >= 400) {
            navLogger.warn(
                { app, method: request.method, status, path: subPath },
                "Proxy-kall fullført med klientfeil",
            );
        } else {
            navLogger.trace({ app, method: request.method, status, path: subPath }, "Proxy-kall fullført");
        }


        return responseWithCorrelationId(backendResponse, correlationId);
    } catch (error) {
        // Feil før eller under backend-kallet må fortsatt kunne spores av både bruker og utvikler.
        if (error instanceof Response) {
            navLogger.warn({ app, status: error.status }, "Proxy-kall feilet");

            throw responseWithCorrelationId(error, correlationId);
        }

        navLogger.error({ app, method: request.method, err: error }, "Proxy-kall feilet");

        throw new Response("Bad Gateway", {
            status: 502,
            headers: { [correlationIdHeader]: correlationId },
        });
    }
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
    return proxyRequest(request, params.app, context);
}

export async function action({ params, request, context }: Route.ActionArgs) {
    return proxyRequest(request, params.app, context);
}
