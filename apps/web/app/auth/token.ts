import {getApiConfig} from "~/api.env.ts";
import {userContext} from "~/context.ts";
import type {Route} from "../../.react-router/types/app/auth/+types/token.ts";
import {getOnBehalfOfToken} from "./auth.utils.server.ts";
import {RouterContextProvider} from "react-router";

const oboToken = async (context: Readonly<RouterContextProvider>, app?: string | null) => {
    const user = context.get(userContext)
    if (!user) throw new Response('Unauthorized', {status: 401});
    if (!app) {
        console.warn("App ikke spesifisert for token request.");
        return "Ingen app ingen token"
    }
    const audience = getApiConfig(app).audience
    return await getOnBehalfOfToken(user, audience);
}

export async function loader({request, context}: Route.LoaderArgs) {
    const url = new URL(request.url);
    const app = url.searchParams.get("app");
    return oboToken(context, app);
}

export async function action({request, context}: Route.ActionArgs) {
    const formData = await request.formData();
    const app = formData.get("app")?.toString();
    return oboToken(context, app);
}
