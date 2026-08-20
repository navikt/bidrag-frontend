import { destroy, initialize, type Unleash, type Variant } from "unleash-client";
import { env } from "~/env.server.ts";
import { navLogger } from "~/server/logger/navLogger.ts";
import { UNLEASH_APP_NAME, type UnleashContext } from "~/server/unleash/unleashContext.ts";

export type { UnleashContext };
export { UNLEASH_APP_NAME };

const DEAKTIVERT_VARIANT: Variant = {
    name: "disabled",
    enabled: false,
    feature_enabled: false,
};

/**
 * Lokale overstyringer av feature toggles, satt via UNLEASH_LOCAL_TOGGLES, f.eks.
 * `UNLEASH_LOCAL_TOGGLES=frontend.belopshistorikk.bereg_sum=true,annet.flagg=false`.
 *
 * Settes i apps/web/.env.development. Gjør at man kan utvikle mot feature toggles uten
 * API-token mot Unleash (tokenet ligger i en Kubernetes-secret som krever utvidede
 * rettigheter). Overstyringene ignoreres i produksjon.
 */
function lokaleOverstyringer(): Map<string, boolean> {
    const overstyringer = new Map<string, boolean>();

    if (env.NODE_ENV === "production" || !env.UNLEASH_LOCAL_TOGGLES) {
        return overstyringer;
    }

    for (const bit of env.UNLEASH_LOCAL_TOGGLES.split(",")) {
        const [navn, verdi] = bit.split("=").map((del) => del.trim());
        if (navn) {
            overstyringer.set(navn, verdi !== "false");
        }
    }

    return overstyringer;
}

let unleashKlient: Unleash | null = null;
let isReadyPromise: Promise<Unleash | null> | null = null;

/**
 * Initialiserer Unleash node-klienten (singleton). Klienten poller Unleash-APIet i
 * bakgrunnen, slik at oppslag mot toggles er raske og synkrone etter oppstart.
 */
export function initUnleash(): Promise<Unleash | null> {
    if (isReadyPromise) {
        return isReadyPromise;
    }

    const apiUrl = env.UNLEASH_SERVER_API_URL;
    const apiToken = env.UNLEASH_SERVER_API_TOKEN;

    if (!apiUrl || !apiToken) {
        navLogger.warn(
            "Unleash er ikke konfigurert – alle feature toggles er av. " +
                "Lokalt: skru flagg av/på med UNLEASH_LOCAL_TOGGLES i apps/web/.env.development",
        );
        isReadyPromise = Promise.resolve(null);
        return isReadyPromise;
    }

    const client = initialize({
        url: apiUrl.endsWith("/api") ? apiUrl : `${apiUrl.replace(/\/$/, "")}/api`,
        appName: UNLEASH_APP_NAME,
        environment: env.UNLEASH_SERVER_API_ENV ?? "development",
        customHeaders: { Authorization: apiToken },
    });

    client.on("error", (error: unknown) => {
        navLogger.error({ err: error }, "Feil fra Unleash-klienten");
    });

    unleashKlient = client;

    isReadyPromise = new Promise<Unleash | null>((resolve) => {
        client.on("ready", () => {
            navLogger.info("Unleash-klienten er klar");
            resolve(client);
        });
        // Ved feil (f.eks. Unleash utilgjengelig) faller vi tilbake til default-verdier
        client.on("error", () => resolve(client));
    });

    return isReadyPromise;
}

export function hentUnleash(): Promise<Unleash | null> {
    return initUnleash();
}

export function stoppUnleash(): void {
    if (unleashKlient) {
        destroy();
        unleashKlient = null;
        isReadyPromise = null;
    }
}

export async function unleashErKlar(): Promise<boolean> {
    return (await hentUnleash()) !== null;
}

export async function isEnabled(flagg: string, context: UnleashContext = {}): Promise<boolean> {
    const overstyring = lokaleOverstyringer().get(flagg);
    if (overstyring !== undefined) {
        return overstyring;
    }

    const client = await hentUnleash();
    return client?.isEnabled(flagg, context) ?? false;
}

export async function getVariant(flagg: string, context: UnleashContext = {}): Promise<Variant> {
    const overstyring = lokaleOverstyringer().get(flagg);
    if (overstyring !== undefined) {
        return { name: "lokal", enabled: overstyring, feature_enabled: overstyring };
    }

    const client = await hentUnleash();
    return client?.getVariant(flagg, context) ?? DEAKTIVERT_VARIANT;
}

export type FrontendToggle = {
    name: string;
    enabled: boolean;
    variant: Variant;
    impressionData: boolean;
};

/**
 * Evaluerer alle toggles for gitt kontekst i samme format som Unleash sitt
 * frontend-API (`/api/frontend`). Brukes av proxy-ruta som betjener
 * unleash-proxy-client i nettleseren.
 */
export async function evaluerAlleToggles(context: UnleashContext = {}): Promise<FrontendToggle[]> {
    const overstyringer = lokaleOverstyringer();
    const client = await hentUnleash();

    const fraUnleash = (client?.getFeatureToggleDefinitions() ?? [])
        .filter((definisjon) => !overstyringer.has(definisjon.name))
        .map((definisjon) => ({
            name: definisjon.name,
            enabled: client?.isEnabled(definisjon.name, context) ?? false,
            variant: client?.getVariant(definisjon.name, context) ?? DEAKTIVERT_VARIANT,
            impressionData: definisjon.impressionData ?? false,
        }));

    const fraOverstyringer = [...overstyringer.entries()].map(([name, enabled]) => ({
        name,
        enabled,
        variant: { name: "lokal", enabled, feature_enabled: enabled },
        impressionData: false,
    }));

    return [...fraUnleash, ...fraOverstyringer].filter((toggle) => toggle.enabled);
}
