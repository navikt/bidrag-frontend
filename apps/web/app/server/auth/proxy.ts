import {getApiConfig} from "~/api.env.ts";
import {userContext} from "~/server/context.ts";
import {getOnBehalfOfToken} from "./auth.utils.server.ts";
import {Route} from "+/server/auth/+types/proxy.ts";
import {navLogger} from "~/server/logger/navLogger.ts";

async function proxyRequest(request: Request, app: string, context: Route.LoaderArgs["context"]): Promise<Response> {
    const user = context.get(userContext);
    if (!user) throw new Response("Unauthorized", {status: 401});

    const apiConfig = getApiConfig(app);
    const token = await getOnBehalfOfToken(user, apiConfig.audience);

    // Bygg backend-URL: behold path etter /proxy/:app, legg til base-URL sin path
    const incomingUrl = new URL(request.url);
    const subPath = incomingUrl.pathname.replace(`/proxy/${app}`, "");

    const baseUrl = new URL(apiConfig.url);
    const backendUrl = new URL(
        baseUrl.pathname.replace(/\/$/, "") + subPath + incomingUrl.search,
        baseUrl.origin
    );
    // Kopier headers fra original request, bytt ut Authorization
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.delete("host");

    const backendResponse = await fetch(backendUrl.toString(), {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        duplex: "half",
    } as RequestInit);

    navLogger.debug(`proxy ${request.method} ${incomingUrl.href} -> ${backendUrl.href} status ${backendResponse.status}`);

    return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: backendResponse.headers,
    });
}

export async function loader({params, request, context}: Route.LoaderArgs) {
    return proxyRequest(request, params.app, context);
}

export async function action({params, request, context}: Route.ActionArgs) {
    return proxyRequest(request, params.app, context);
}
