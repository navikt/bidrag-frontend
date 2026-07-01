import { getApiConfig } from "~/api.env.ts";
import { authTokenContext } from "~/server/auth/auth.context.ts";
import { navLogger } from "~/server/logger/navLogger.ts";
import type { Route } from "./+types/proxy.ts";
import { getOnBehalfOfToken } from "./auth.utils.server.ts";

async function proxyRequest(
    request: Request,
    app: string,
    context: Route.LoaderArgs["context"],
): Promise<Response> {
    const authToken = context.get(authTokenContext);
    if (!authToken) throw new Response("Unauthorized", { status: 401 });

    const apiConfig = getApiConfig(app);
    const oboToken = await getOnBehalfOfToken(authToken, apiConfig.audience);

    // Bygg backend-URL: behold path etter /proxy/:app, legg til base-URL sin path
    const incomingUrl = new URL(request.url);
    const subPath = incomingUrl.pathname.replace(`/proxy/${app}`, "");

    const baseUrl = new URL(apiConfig.url);
    const backendUrl = new URL(
        baseUrl.pathname.replace(/\/$/, "") + subPath + incomingUrl.search,
        baseUrl.origin,
    );
    // Kopier headers fra original request, bytt ut Authorization
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${oboToken}`);
    headers.delete("host");

    const backendResponse = await fetch(backendUrl.toString(), {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
            ? undefined
            : request.body,
        duplex: "half",
    } as RequestInit);

    navLogger.debug(
        `proxy ${request.method} ${incomingUrl.href} -> ${backendUrl.href} status ${backendResponse.status}`,
    );

    return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: backendResponse.headers,
    });
}

export async function loader({ params, request, context }: Route.LoaderArgs) {
    return proxyRequest(request, params.app, context);
}

export async function action({ params, request, context }: Route.ActionArgs) {
    return proxyRequest(request, params.app, context);
}
