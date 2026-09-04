import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

import { useAppContext } from "../../../store/AppContext";
import ReactError from "../../../types/api/ReactError";
import UserError from "../../../types/api/UserError";
import { showErrorPage } from "./ErrorUtils";

interface Props {
    children: ReactNode;
    showWarningPage: (err: string) => void;
}

export function ErrorBoundaryWrapper({ children }: PropsWithChildren<unknown>) {
    const { setError } = useAppContext();
    return <ErrorBoundary showWarningPage={setError}>{children}</ErrorBoundary>;
}

class ErrorBoundary extends Component<Props, Record<string, never>> {
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (error instanceof UserError) {
            this.props.showWarningPage(error.message);
        } else {
            const url = window?.location?.pathname;
            showErrorPage(
                new ReactError(
                    `Det skjedde en feil i React koden (path=${url}, app=bidrag-frontend, modul=dokument)`,
                    errorInfo.componentStack ?? "",
                    null,
                ),
            );
        }
    }

    public render() {
        return this.props.children;
    }
}
