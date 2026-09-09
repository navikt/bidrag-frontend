export type HeaderNavigationMode = "default" | "sak" | "sakshistorikk" | "sakforside";

export interface IHeaderNavigationContext {
    mode?: HeaderNavigationMode;
    saksnummer?: string | null;
    sessionState?: string | null;
    enhet?: string | null;
}

export interface IWindowAppContext {
    appName: string;
    moduleName: string;
}

export interface IWindowLogToServer {
    info: (message: string) => void;
    warning: (message: string) => void;
    debug: (message: string) => void;
    error: (message: string, err: Error) => void;
}

/**
 * Faro initialiseres og eksponeres globalt (`window.faro`) av web-shellet
 * (`apps/web/app/faro.client.ts`). Verken `@bidrag/common` eller andre apper i
 * monorepoet har `@grafana/faro-*` som avhengighet, så vi deklarerer her — som
 * eneste sted i repoet — kun det API-overflaten vi faktisk bruker:
 * `pushEvent` (analytics-hendelser fra behandling-app) og `pushError`
 * (`AbstractLoggerService`, som sender ekte `Error`-instanser videre som
 * telemetri-exceptions). Flere `declare global`-blokker for samme `Window.faro`
 * med ulik form i forskjellige apper feiler typesjekken der begge er en del av
 * samme TS-program (f.eks. når en app importerer `@bidrag/common`).
 */
export interface FaroGlobal {
    api: {
        pushEvent: (name: string, attributes?: Record<string, string>) => void;
        pushError: (feil: Error, options?: { context?: Record<string, string> }) => void;
    };
}

declare global {
    interface Window {
        __otelSessionContext?: unknown;
        faro?: FaroGlobal;
    }
}
