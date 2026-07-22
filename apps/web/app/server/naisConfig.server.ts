import path from "node:path";
import { pathToFileURL } from "node:url";
import type { NaisConfig } from "~/nais.ts";

let cached: NaisConfig | null = null;

export async function getNaisConfig(): Promise<NaisConfig> {
    if (cached) {
        return cached;
    }

    // I prod monterer Nais en generert nais.js her (kjøres alltid fra poden,
    // uavhengig av at klientbundlene serveres fra CDN), se .nais/nais.yaml
    // (frontend.generatedConfig.mountPath) og
    // https://docs.nais.io/observability/frontend/how-to/setup-faro/
    const mountedPath = path.resolve(process.cwd(), "build/client/nais.js");
    try {
        const mod = (await import(/* @vite-ignore */ pathToFileURL(mountedPath).href)) as {
            default: NaisConfig;
        };
        cached = mod.default;
    } catch {
        // Lokal utvikling: build/client/nais.js finnes ikke før `pnpm build`
        const local = (await import("../nais.js")) as { default: NaisConfig };
        cached = local.default;
    }

    return cached;
}
