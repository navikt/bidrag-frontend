import { userContext } from "~/server/auth/auth.context.ts";
import { evaluerAlleToggles } from "~/server/unleash/unleash.server.ts";
import { byggUnleashContext } from "~/server/unleash/unleashContext.ts";
import type { Route } from "./+types/unleashProxyRoute.ts";

/**
 * Server-side proxy mot Unleash, i samme format som Unleash sitt frontend-API.
 * Unleash-APIet kan ikke kalles direkte fra nettleseren (ingen CORS, og API-tokenet
 * er en hemmelighet), så nettleseren snakker med denne ruta i stedet.
 *
 * Ruta er beskyttet av authMiddleware i root.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
    const bruker = context.get(userContext);
    const unleashContext = byggUnleashContext(new URL(request.url), bruker?.NAVident);
    const toggles = await evaluerAlleToggles(unleashContext);

    return Response.json(
        { toggles },
        {
            headers: {
                "Cache-Control": "no-store",
            },
        },
    );
}

/**
 * unleash-proxy-client sender metrikker og registrering med POST. Vi tar imot og
 * kvitterer, men videresender ikke – metrikker rapporteres av node-klienten.
 */
export async function action() {
    return new Response(null, { status: 202 });
}
