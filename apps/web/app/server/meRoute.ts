import { userContext } from "~/server/auth/auth.context";
import type { Route } from "./+types/meRoute.ts";

/**
 * Returnerer innlogget saksbehandler. Brukes av SecuritySessionUtils i
 * @bidrag/common, slik at biblioteks-koden slipper å kjenne til rutene i web-appen.
 * Autentisering håndteres av authMiddleware, som allerede har lagt brukeren i konteksten.
 */
export function loader({ context }: Route.LoaderArgs) {
    const bruker = context.get(userContext);

    if (!bruker) {
        throw new Response("Ikke innlogget", { status: 401 });
    }

    return Response.json(bruker);
}
