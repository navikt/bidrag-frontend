import {getToken, validateToken} from "@navikt/oasis";
import {redirect} from "react-router";
import type {Route} from "../../.react-router/types/app/+types/root";
import {parseToken} from "./auth.utils.server.ts";
import {userContext} from "./auth.context.ts";

const OFFENTLIGE_STIER = ["/internal/", "/oauth2/"];

export const authMiddleware: Route.MiddlewareFunction = async ({request, context}, next) => {
    const url = new URL(request.url);

    if (OFFENTLIGE_STIER.some((sti) => url.pathname.startsWith(sti))) {
        return next();
    }

    const token = getToken(request);

    const loginUrl = `/oauth2/login`;
    if (!token) {
        return redirect(loginUrl);
    }

    //

    const valid = await validateToken(token);

    if (!valid.ok) {
        throw new Response('Ugyldig token', {status: 401});
    }

    const user = parseToken(token);
    context.set(userContext, user);

    return next();
};

