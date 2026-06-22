import {getApiConfig} from "~/api.env.ts";
import {userContext} from "~/context.ts";
import type {Route} from "../../.react-router/types/app/auth/+types/proxy.ts";
import {getOnBehalfOfToken} from "./auth.utils.server.ts";


async function proxyRequest(request: Request, app: string, context: Route.LoaderArgs["context"]): Promise<Response> {
    const user = context.get(userContext);
    if (!user) throw new Response("Unauthorized", {status: 401});

    const apiConfig = getApiConfig(app);
    const token = await getOnBehalfOfToken(user, apiConfig.audience);

    // Bygg backend-URL: behold path etter /proxy/:app
    const incomingUrl = new URL(request.url);
    const backendUrl = new URL(incomingUrl.pathname.replace(`/proxy/${app}`, "") + incomingUrl.search, apiConfig.url);

    // Kopier headers fra original request, bytt ut Authorization
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.delete("host");

    console.log("proxy", request.method,incomingUrl , "->", backendUrl);

    const backendResponse = await fetch(backendUrl.toString(), {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        duplex: "half",
    } as RequestInit);

    return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: backendResponse.headers,
    });
}

export async function loader({params, request, context}: Route.LoaderArgs) {
    console.log("proxy", request.url);
    return proxyRequest(request, params.app, context);
}

export async function action({params, request, context}: Route.ActionArgs) {
    return proxyRequest(request, params.app, context);
}
