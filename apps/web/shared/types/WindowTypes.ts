/**
 * Global type declarations for window properties injected by the shell app (bidragui)
 */

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

declare global {
    interface Window {
        setHeaderNavigationContext: (context: IHeaderNavigationContext) => void;
        setAppContext: (context: IWindowAppContext) => void;
        clearAppContext: () => void;
    }
}

export default {};
