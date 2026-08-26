import type { Variant } from "unleash-client";
import type { NavUser } from "~/common/NavUser.ts";
import { getVariant, isEnabled } from "~/server/unleash/unleash.server.ts";
import { UNLEASH_APP_NAME, type UnleashContext } from "~/server/unleash/unleashContext.ts";

/**
 * Bygger Unleash-kontekst for server-side oppslag (loaders/actions), slik at man kan
 * styre toggles per saksbehandler (userId/NAVident), sak eller enhet.
 */
export function serverUnleashContext({
    bruker,
    saksnummer,
    enhet,
}: {
    bruker?: NavUser | null;
    saksnummer?: string;
    enhet?: string;
}): UnleashContext {
    return {
        userId: bruker?.NAVident,
        appName: UNLEASH_APP_NAME,
        properties: {
            ...(bruker?.NAVident ? { NAVident: bruker.NAVident } : {}),
            ...(saksnummer ? { saksnummer } : {}),
            ...(enhet ? { enhet } : {}),
        },
    };
}

/**
 * Server-side oppslag mot feature toggles. Bruker Unleash node-klienten,
 * som poller Unleash-APIet i bakgrunnen.
 */
export async function flaggIsEnabled(flag: string, context: UnleashContext = {}): Promise<boolean> {
    return isEnabled(flag, context);
}

export async function flaggGetVariant(flag: string, context: UnleashContext = {}): Promise<Variant> {
    return getVariant(flag, context);
}
