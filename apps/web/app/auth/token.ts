import {getApiConfig} from "~/api.env.ts";
import type {NavUser} from "~/auth/NavUser.ts";
import {userContext} from "~/context.ts";
import type {Route} from "../../.react-router/types/app/auth/+types/token.ts";
import {getOnBehalfOfToken} from "./auth.utils.server.ts";

const getOnbehalfOfToken = async (app: string, user: NavUser) => {
    const audience = getApiConfig(app).audience
    return await getOnBehalfOfToken(user, audience);
}

export async function loader({request, context}: Route.LoaderArgs) {
    const user = context.get(userContext)
    if (!user )throw new Response('Unauthorized', {status: 401});
    const url = new URL(request.url);
    const app = url.searchParams.get("app") ?? "";
    return getOnbehalfOfToken(app, user);
}

export async function action({request, context}: Route.ActionArgs) {
    const user = context.get(userContext);
    if (!user )throw new Response('Unauthorized', {status: 401});
    const formData = await request.formData();
    const app = formData.get("app")?.toString() || "";
    return getOnbehalfOfToken(app, user)
}
