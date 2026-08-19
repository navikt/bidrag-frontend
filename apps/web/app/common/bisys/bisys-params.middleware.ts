import type { Route } from "../../../.react-router/types/app/+types/root.ts";
import { persistBisysParams } from "@bidrag/common";

export const bisysParamsMiddleware: Route.ClientMiddlewareFunction = async (
    { request },
    next,
) => {
    persistBisysParams(new URL(request.url));
    return next();
};
