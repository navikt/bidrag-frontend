import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {BidragCommonsProvider, SecuritySessionUtils} from "@bidrag/common";
import useStartTracing from "@bidrag/common/react_components/hooks/useStartTracing";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

interface AppState {
    journalpostId: string;
    disableJournalpostPoller: boolean;
    sessionState: string;
    påloggetEnhet: string;
    saksnummer: string;
    saksbehandlerIdent: string;
    currentPage: PageType;
}

export enum PageType {
    REGISTRER_JOURNALPOST,
    VIS_JOURNALPOST,
    OPEN_DOCUMENT,
}

export interface ErrorPageState {
    title?: string;
    message: string;
}

interface AppContextType {
    appState: AppState;
    error?: ErrorPageState | null;
    errorMessages: string[];
    setErrorMessages: (errorMessages: string[]) => void;
    setError: (message: string | null, title?: string) => void;
    updateAppState: (newState: Partial<AppState>) => void;
    showErrorMessage: (value: string[]) => void;
}

const ApptContext = createContext<AppContextType | undefined>(undefined);
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 3,
            staleTime: Infinity,
            retryDelay: 2000,
        },
    },
});
export const AppProvider = ({children}: { children: ReactNode }) => {
    const [appState, setAppState] = useState<AppState>({} as AppState);
    const [error, setError] = useState<ErrorPageState | null>(null);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

    useStartTracing();
    useEffect(() => {
        SecuritySessionUtils.hentSaksbehandlerId().then((saksbehandlerId) => {
            setAppState((prevState) => ({...prevState, saksbehandlerIdent: saksbehandlerId}));
        });
    }, []);

    function updateAppState(newState: Partial<AppState>) {
        setAppState((prevState) => ({...prevState, ...newState}));
    }

    const showErrorMessage = (value: string[]) => {
        setErrorMessages(appendToShowErrorMessageState(value[0] || ""));
    };

    const appendToShowErrorMessageState = (newValue: string) => (currentErrors: string[]) => {
        if (!currentErrors.some((error) => error === newValue)) {
            return [...currentErrors, newValue];
        }
        return currentErrors;
    };

    return (
        <BidragCommonsProvider>
            <QueryClientProvider client={queryClient}>
                <ApptContext.Provider
                    value={{
                        appState,
                        updateAppState,
                        setError: (message, title) =>
                            setError(message == null || message == undefined ? null : {message, title}),
                        error,
                        setErrorMessages,
                        errorMessages,
                        showErrorMessage,
                    }}
                >
                    {children}
                </ApptContext.Provider>
                <ReactQueryDevtools initialIsOpen={false}/>
            </QueryClientProvider>
        </BidragCommonsProvider>
    );
};

export const useAppContext = () => {
    const context = useContext(ApptContext);
    if (context === undefined) {
        throw new Error("useJournalpost must be used within a JournalpostProvider");
    }
    return context;
};
