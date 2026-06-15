import {getToken, validateToken} from "@navikt/oasis";
import {redirect} from "react-router";
import type {Route} from "../../.react-router/types/app/+types/root";

const OFFENTLIGE_STIER = ["/internal/", "/oauth2/"];

export const authMiddleware: Route.MiddlewareFunction = async ({request}, next) => {
    const url = new URL(request.url);

    if (OFFENTLIGE_STIER.some((sti) => url.pathname.startsWith(sti))) {
        return next();
    }

    const token = getToken(request);
    console.log("token",token);

    const loginUrl = `/oauth2/login`;
    if (!token) {
        return redirect(loginUrl);
    }


    // const valid = await validateToken(token);
    // console.log("valid", valid);
    // if (!valid.ok) {
    //     return redirect(loginUrl);
    // }

    return next();
};

