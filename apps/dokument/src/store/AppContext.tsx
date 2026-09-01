import { BidragCommonsProvider, SecuritySessionUtils } from "@bidrag/common";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { useHentPerson2 } from "../hooks/usePersonApi";

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
    REGISTRER_JOURNALPOST = 0,
    VIS_JOURNALPOST = 1,
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

/**
 * apps/web setter opp `QueryClientProvider` på roten, så her gjenbrukes den samme
 * queryClienten. `BidragCommonsProvider` nøstes med dokument-appens egen
 * person-oppslagshook slik at felleskomponenter (bl.a. `PersonNavnIdent`) henter
 * person via `bidrag-person`-proxyen.
 */
export const AppProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient();
    const [appState, setAppState] = useState<AppState>({} as AppState);
    const [error, setError] = useState<ErrorPageState | null>(null);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

    useEffect(() => {
        SecuritySessionUtils.hentSaksbehandlerId().then((saksbehandlerId) => {
            setAppState((prevState) => ({ ...prevState, saksbehandlerIdent: saksbehandlerId }));
        });
    }, []);

    function updateAppState(newState: Partial<AppState>) {
        setAppState((prevState) => ({ ...prevState, ...newState }));
    }
    const showErrorMessage = (value: string[]) => {
        setErrorMessages(appendToShowErrorMessageState(value[0]));
    };

    const appendToShowErrorMessageState = (newValue: string) => (currentErrors: string[]) => {
        if (!currentErrors.some((error) => error === newValue)) {
            return [...currentErrors, newValue];
        }
        return currentErrors;
    };

    return (
        <BidragCommonsProvider client={queryClient} useHentPersonData={useHentPerson2}>
            <ApptContext.Provider
                value={{
                    appState,
                    updateAppState,
                    setError: (message, title) => setError(message == null ? null : { message, title }),
                    error,
                    setErrorMessages,
                    errorMessages,
                    showErrorMessage,
                }}
            >
                {children}
            </ApptContext.Provider>
        </BidragCommonsProvider>
    );
};

export const useAppContext = () => {
    const context = useContext(ApptContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};
