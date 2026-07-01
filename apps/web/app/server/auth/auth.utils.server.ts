import {
    parseAzureUserToken,
    requestOboToken,
    validateToken,
} from "@navikt/oasis";
import { secureNavLogger } from "~/server/logger/navLogger.ts";
import type { NavUser } from "../../common/NavUser.ts";

export async function getOnBehalfOfToken(token: string, audience: string) {
    if (!token) {
        secureNavLogger.error("Missing token");
        throw new Response("Missing token", { status: 401 });
    }

    const valid = await validateToken(token);
    if (!valid.ok) {
        secureNavLogger.error(`Failed to validate token: ${valid.error}`);
        throw new Response("Token validation failed", { status: 401 });
    }

    const obo = await requestOboToken(token, audience);
    if (!obo.ok) {
        secureNavLogger.error(`Failed to get OBO token: ${obo.error}`);
        throw new Response("Unauthorized", { status: 401 });
    }

    return obo.token;
}

export function parseToken(token: string): NavUser {
    if (!token) {
        throw new Error("Missing token");
    }
    const parse = parseAzureUserToken(token);
    if (parse.ok) {
        return {
            NAVident: parse.NAVident,
            name: parse.name,
            username: parse.preferred_username,
        };
    }
    throw new Response("Failed to parse azure token", { status: 401 });
}
