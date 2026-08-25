import { InMemoryStorageProvider, UnleashClient } from "unleash-proxy-client";
import { describe, expect, it } from "vitest";

const bootstrap = [
    {
        name: "frontend.belopshistorikk.beregn_sum",
        enabled: true,
        variant: { name: "lokal", enabled: true, feature_enabled: true },
        impressionData: false,
    },
];

/**
 * Sikrer at toggles evaluert på serveren (root-loaderen) gjelder umiddelbart i
 * nettleseren, også før – eller uten – et vellykket kall mot /unleash/proxy.
 */
describe("unleash bootstrap fra server", () => {
    it("gir riktig verdi med én gang, selv om proxy-kallet feiler", async () => {
        const client = new UnleashClient({
            url: "http://localhost/unleash/proxy",
            clientKey: "bidrag-frontend",
            appName: "bidrag-frontend",
            disableMetrics: true,
            storageProvider: new InMemoryStorageProvider(),
            bootstrap,
            bootstrapOverride: true,
            fetch: () => Promise.reject(new Error("proxy nede")),
        });

        await client.start();

        expect(client.isEnabled("frontend.belopshistorikk.beregn_sum")).toBe(true);
        expect(client.isEnabled("ukjent.flagg")).toBe(false);
        client.stop();
    });

    it("tom bootstrap fra serveren overstyrer lagrede toggles fra tidligere sesjon", async () => {
        const storage = new InMemoryStorageProvider();
        await storage.save("repo:repo", bootstrap);

        const client = new UnleashClient({
            url: "http://localhost/unleash/proxy",
            clientKey: "bidrag-frontend",
            appName: "bidrag-frontend",
            disableMetrics: true,
            storageProvider: storage,
            bootstrap: [],
            bootstrapOverride: true,
            fetch: () => Promise.reject(new Error("proxy nede")),
        });

        await client.start();

        expect(client.isEnabled("frontend.belopshistorikk.beregn_sum")).toBe(false);
        client.stop();
    });
});
