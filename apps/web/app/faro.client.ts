import { initializeFaro, getWebInstrumentations } from "@grafana/faro-web-sdk";
import { ReactIntegration } from "@grafana/faro-react";
import nais from "/nais.js";

let faroInstance: ReturnType<typeof initializeFaro> | null = null;

export function initFaro() {
    if (faroInstance) {
        return faroInstance;
    }

    faroInstance = initializeFaro({
        url: nais.telemetryCollectorURL,
        paused: window.location.hostname === "localhost",
        app: nais.app,
        instrumentations: [
            ...getWebInstrumentations({
                captureConsole: true,
            }),
            new ReactIntegration(),
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
            if (/\b\d{11}\b/.test(payload)) {
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
