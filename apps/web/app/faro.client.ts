import { initializeFaro, getWebInstrumentations } from "@grafana/faro-web-sdk";

let faroInstance: ReturnType<typeof initializeFaro> | null = null;

export interface FaroConfig {
    appName: string;
}

export function initFaro(config: FaroConfig) {
    if (faroInstance) {
        return faroInstance;
    }

    const collectorUrl =
        process.env.NAIS_CLUSTER_NAME === "prod-gcp"
            ? "https://telemetry.nav.no/collect"
            : "https://telemetry.ekstern.dev.nav.no/collect";

    faroInstance = initializeFaro({
        url: collectorUrl,
        paused: window.location.hostname === "localhost",
        app: {
            name: config.appName,
            namespace: "bidrag",
        },
        instrumentations: [
            ...getWebInstrumentations({
                captureConsole: true,
            }),
        ],
        pageTracking: {
            generatePageId: (location) => {
                return location.pathname
                    .replace(/\/sak\/[^/]+/, "/sak/{saksnummer}")
                    .replace(/\/proxy\/[^/]+/, "/proxy/{app}");
            },
        },
        beforeSend: (item) => {
            // Strip query parameters from page URLs (may contain tokens, codes, identifiers)
            if (item.meta?.page?.url) {
                try {
                    const url = new URL(item.meta.page.url);
                    url.search = "";
                    item.meta.page.url = url.toString();
                } catch {
                    // ignore malformed URLs
                }
            }

            // Drop items that may contain fødselsnummer (11-digit pattern)
            const payload = JSON.stringify(item);
            if (/\d{11}/.test(payload)) {
                return null;
            }

            return item;
        },
    });

    return faroInstance;
}

export function getFaro() {
    return faroInstance;
}
