import React, { type PropsWithChildren, useContext, useState } from "react";

type ErrorContextProps = {
    warningMessage?: string;
    errorMessage?: string;
    errorSource?: ErrorSource;
    resetError: () => void;
    resetErrorMessage: () => void;
    addError: (error: IForsendelseApiError) => void;
    addWarning: (warningMessage: string) => void;
};

type ErrorSource = "dokumenter" | "opprettforsendelse" | "opprettnotat" | "hentforsendelse";
interface IForsendelseApiError {
    message: string;
    source?: ErrorSource;
}
export const useErrorContext = () => {
    const context = useContext(ErrorContext);
    if (context === undefined) {
        throw new Error("useErrorContext must be used within a ErrorProvider");
    }
    return context;
};
export const ErrorContext = React.createContext<ErrorContextProps>({} as ErrorContextProps);

export default function ErrorProvider({ children }: PropsWithChildren<unknown>) {
    const [error, setError] = useState<IForsendelseApiError>();
    const [warningMessage, setWarningMessage] = useState<string>();

    const resetError = () => {
        setError(undefined);
        setWarningMessage(undefined);
    };

    const resetErrorMessage = () => {
        setError((prev) => ({ ...prev, message: undefined }));
        setWarningMessage(undefined);
    };
    const addError = (error) => setError(error);
    const addWarning = (warningMessage: string) => setWarningMessage(warningMessage);

    return (
        <ErrorContext.Provider
            value={{
                resetError,
                resetErrorMessage,
                addError,
                addWarning,
                errorMessage: error?.message,
                errorSource: error?.source,
                warningMessage,
            }}
        >
            {children}
        </ErrorContext.Provider>
    );
}
