import { BroadcastMessage, PersonBroadcastMessage } from "./types/broadcast";

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

declare global {
    interface Window {
        openPersonsok: () => Window | null;
        waitForPersonSokResult: () => Promise<BroadcastMessage<PersonBroadcastMessage>>;
    }
}
