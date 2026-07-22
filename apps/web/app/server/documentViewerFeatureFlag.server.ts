import { InMemoryStorageProvider, UnleashClient } from "unleash-proxy-client";
import { env } from "~/env.server.ts";

const DOCUMENT_VIEWER_FLAG = "dokumentvisning.ny_losning";

let cachedEnabled: boolean | undefined;
let clientPromise: Promise<UnleashClient | null> | null = null;

async function getUnleashClient(): Promise<UnleashClient | null> {
    const unleashUrl = env.UNLEASH_PROXY_URL;
    const unleashClientKey = env.UNLEASH_PROXY_CLIENT_KEY;

    if (!unleashUrl || !unleashClientKey) {
        return null;
    }

    if (!clientPromise) {
        clientPromise = (async () => {
            const client = new UnleashClient({
                url: unleashUrl,
                clientKey: unleashClientKey,
                appName: "bidrag-frontend",
                storageProvider: new InMemoryStorageProvider(),
                disableRefresh: true,
                disableMetrics: true,
                fetch,
            });

            await client.start();
            return client;
        })().catch(() => null);
    }

    return clientPromise;
}

export async function isDocumentViewerEnabled(): Promise<boolean> {
    if (env.OVERRIDE_BRUK_DOKUMENTVISNING_POC !== undefined) {
        return env.OVERRIDE_BRUK_DOKUMENTVISNING_POC;
    }

    if (cachedEnabled !== undefined) {
        return cachedEnabled;
    }

    const client = await getUnleashClient();
    if (!client) {
        return false;
    }

    cachedEnabled = client.isEnabled(DOCUMENT_VIEWER_FLAG);
    return cachedEnabled;
}
