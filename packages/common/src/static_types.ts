import type {LogErrorType} from "./types";
import type {IHeaderNavigationContext, IWindowAppContext, IWindowLogToServer} from "./windowTypes";

declare global {
    interface Window {
        app_name: string;
        appName: string;
        moduleName: string;
        showErrorPage: (error: LogErrorType) => void;
        countMetric: (name: string, value: string) => void;
        logToServer: IWindowLogToServer;
        setHeaderNavigationContext: (context: IHeaderNavigationContext) => void;
        setAppContext: (context: IWindowAppContext) => void;
        clearAppContext: () => void;
    }
}

export default {};
