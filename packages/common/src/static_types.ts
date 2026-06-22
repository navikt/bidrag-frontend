import { BroadcastMessage, PersonBroadcastMessage } from "./types";
import { LogErrorType } from "./types";
import { IHeaderNavigationContext, IWindowAppContext, IWindowLogToServer } from "./windowTypes";

declare global {
    interface Window {
        app_name: string;
        appName: string;
        moduleName: string;
        showErrorPage: (error: LogErrorType) => void;
        openPersonsok: () => Window | null;
        waitForPersonSokResult: () => Promise<BroadcastMessage<PersonBroadcastMessage>>;
        countMetric: (name: string, value: string) => void;
        logToServer: IWindowLogToServer;
        setHeaderNavigationContext: (context: IHeaderNavigationContext) => void;
        setAppContext: (context: IWindowAppContext) => void;
        clearAppContext: () => void;
    }
}

export default {};
