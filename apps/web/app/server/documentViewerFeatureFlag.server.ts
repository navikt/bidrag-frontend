import { InMemoryStorageProvider, type IVariant, UnleashClient } from "unleash-proxy-client";
import { env } from "~/env.server.ts";

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

export async function flaggIsEnabled(flag: string): Promise<boolean> {
    const unleashClient = await getUnleashClient();
    if (!unleashClient) {
        return false;
    }
    return unleashClient.isEnabled(flag);
}

export async function flaggGetVariant(flag: string): Promise<IVariant | undefined> {
    const unleashClient = await getUnleashClient();
    if (!unleashClient) {
        return undefined;
    }
    return unleashClient.getVariant(flag);
}
