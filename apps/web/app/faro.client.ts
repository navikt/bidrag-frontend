import { maskerFnr } from "@bidrag/common/logging/maskerFnr";
import { ReactIntegration } from "@grafana/faro-react";
import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import type { NaisConfig } from "~/nais.ts";
import { maskPathnameForPageId } from "./faro.utils.ts";

let faroInstance: ReturnType<typeof initializeFaro> | null = null;

export function initFaro(nais: NaisConfig) {
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
                return maskPathnameForPageId(location.pathname);
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

            // Maskerer fødselsnummer i stedet for å droppe hele signalet. Tidligere ble
            // alt med 11 sammenhengende sifre forkastet, slik at en falsk positiv
            // (kontonummer, ordre-ID) stille fjernet et helt feilsignal.
            const { verdi, antall } = maskerFnr(item);
            if (antall === 0) {
                return item;
            }

            return {
                ...verdi,
                meta: { ...verdi.meta, maskert_fnr: String(antall) },
            };
        },
    });

    return faroInstance;
}

export function getFaro() {
    return faroInstance;
}
